import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import SpotlightCard from './SpotlightCard';
import ScrollReveal from './ScrollReveal';
import {
  getMealAttendances,
  saveMealAttendance,
  type MealAttendance,
  type User
} from '../utils/db';

const MEAL_SLOTS = [
  { id: 'Breakfast', label: 'Breakfast', time: '7:30 AM - 9:30 AM', icon: '☕', color: '#f59e0b' },
  { id: 'Lunch', label: 'Lunch', time: '12:30 PM - 2:30 PM', icon: '🍛', color: '#10b981' },
  { id: 'Snacks', label: 'Snacks', time: '5:00 PM - 6:30 PM', icon: '🥪', color: '#8b5cf6' },
  { id: 'Dinner', label: 'Dinner', time: '8:00 PM - 10:00 PM', icon: '🍲', color: '#3b82f6' }
] as const;

interface MealAttendanceCalendarProps {
  user: User;
  showToast?: (msg: string, type?: 'success' | 'danger' | 'warning') => void;
  onAttendanceChange?: () => void;
}

export default function MealAttendanceCalendar({
  user,
  showToast,
  onAttendanceChange
}: MealAttendanceCalendarProps) {
  const [attendances, setAttendances] = useState<MealAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Generate the next 7 days starting from today
  const upcomingDays = useMemo(() => {
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const fullWeekday = d.toLocaleDateString('en-US', { weekday: 'long' });
      
      days.push({
        dateStr,
        dayName,
        formattedDate,
        fullWeekday,
        isToday: i === 0
      });
    }
    return days;
  }, []);

  const [selectedDateStr, setSelectedDateStr] = useState<string>(upcomingDays[0]?.dateStr || '');

  const loadAttendances = async () => {
    setLoading(true);
    try {
      const data = await getMealAttendances({ user_id: user.user_id });
      setAttendances(data);
    } catch (err) {
      console.error('Failed to load meal attendances', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendances();
  }, [user.user_id]);

  // Check if a specific date + slot is marked as attending (default is true if not recorded)
  const isAttending = (dateStr: string, slot: string): boolean => {
    const record = attendances.find(
      a => a.date === dateStr && a.slot.toLowerCase() === slot.toLowerCase()
    );
    if (!record) return true; // Default attending
    return record.attending !== false;
  };

  const handleToggleAttendance = async (dateStr: string, slot: string) => {
    const currentStatus = isAttending(dateStr, slot);
    const newStatus = !currentStatus;
    const actionKey = `${dateStr}-${slot}`;
    setSavingKey(actionKey);

    // Optimistic state update
    setAttendances(prev => {
      const existingIdx = prev.findIndex(
        a => a.date === dateStr && a.slot.toLowerCase() === slot.toLowerCase()
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], attending: newStatus };
        return updated;
      }
      return [
        ...prev,
        {
          id: `att-temp-${Date.now()}`,
          user_id: user.user_id,
          user_name: user.name,
          date: dateStr,
          slot,
          attending: newStatus
        }
      ];
    });

    try {
      await saveMealAttendance({
        date: dateStr,
        slot,
        attending: newStatus
      });

      if (showToast) {
        if (newStatus) {
          showToast(`Marked attending for ${slot} on ${dateStr}!`, 'success');
        } else {
          showToast(`Marked "I will skip this meal" for ${slot} on ${dateStr}. Kitchen notified!`, 'warning');
        }
      }
      if (onAttendanceChange) onAttendanceChange();
    } catch (err: unknown) {
      console.error(err);
      if (showToast) {
        showToast('Failed to update meal attendance. Reverting...', 'danger');
      }
      loadAttendances(); // Revert on failure
    } finally {
      setSavingKey(null);
    }
  };

  const handleSetDayAttendance = async (dateStr: string, attendAll: boolean) => {
    setSavingKey(`day-${dateStr}`);
    try {
      await Promise.all(
        MEAL_SLOTS.map(slot =>
          saveMealAttendance({
            date: dateStr,
            slot: slot.id,
            attending: attendAll
          })
        )
      );

      setAttendances(prev => {
        const updated = [...prev];
        for (const slot of MEAL_SLOTS) {
          const idx = updated.findIndex(
            a => a.date === dateStr && a.slot.toLowerCase() === slot.id.toLowerCase()
          );
          if (idx >= 0) {
            updated[idx] = { ...updated[idx], attending: attendAll };
          } else {
            updated.push({
              id: `att-day-${Date.now()}-${slot.id}`,
              user_id: user.user_id,
              date: dateStr,
              slot: slot.id,
              attending: attendAll
            });
          }
        }
        return updated;
      });

      if (showToast) {
        showToast(
          attendAll
            ? `Marked attending for all meals on ${dateStr}.`
            : `Marked skipping all meals on ${dateStr}. Mess food waste reduced!`,
          attendAll ? 'success' : 'warning'
        );
      }
      if (onAttendanceChange) onAttendanceChange();
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Failed to update full day status.', 'danger');
    } finally {
      setSavingKey(null);
    }
  };

  // Overall statistics for the next 7 days
  const stats = useMemo(() => {
    const totalSlots = upcomingDays.length * 4;
    let skippedCount = 0;
    
    for (const day of upcomingDays) {
      for (const slot of MEAL_SLOTS) {
        if (!isAttending(day.dateStr, slot.id)) {
          skippedCount++;
        }
      }
    }

    const attendingCount = totalSlots - skippedCount;
    const estimatedSavedWasteKg = Math.round(skippedCount * 0.45 * 10) / 10; // ~450g average meal portion

    return {
      totalSlots,
      skippedCount,
      attendingCount,
      estimatedSavedWasteKg
    };
  }, [upcomingDays, attendances]);

  const selectedDayObj = upcomingDays.find(d => d.dateStr === selectedDateStr) || upcomingDays[0];

  return (
    <div style={{ marginBottom: '2.5rem' }}>
      
      {/* Overview Ribbon */}
      <ScrollReveal delay={0.05}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <SpotlightCard glowColor="rgba(16, 185, 129, 0.15)">
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
              Weekly Meal Attendance
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--success)' }}>
              {stats.attendingCount} / {stats.totalSlots}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Planned meals over next 7 days
            </div>
          </SpotlightCard>

          <SpotlightCard glowColor="rgba(245, 158, 11, 0.15)">
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
              Meals Marked Skipped
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--warning)' }}>
              {stats.skippedCount} Meals
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Automatically scales down kitchen prep
            </div>
          </SpotlightCard>

          <SpotlightCard glowColor="rgba(59, 130, 246, 0.15)">
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
              Est. Food Waste Prevented
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#60a5fa' }}>
              ~{stats.estimatedSavedWasteKg} kg
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Portions not overcooked by hostel kitchen
            </div>
          </SpotlightCard>
        </div>
      </ScrollReveal>

      {/* Main Weekly Calendar Card */}
      <SpotlightCard glowColor="rgba(46, 213, 115, 0.1)">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📅</span> Weekly Meal Skip & Attendance Planner
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
              Going out or skipping a meal? Mark <strong>"I will skip this meal"</strong> so the manager's Smart Prep Planner automatically adjusts cooking batches!
            </p>
          </div>

          {/* Quick full-day actions */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => handleSetDayAttendance(selectedDateStr, false)}
              disabled={savingKey !== null}
              style={{
                fontSize: '0.75rem',
                padding: '0.4rem 0.8rem',
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                cursor: 'pointer'
              }}
              title="Mark all 4 meals on this day as skipped"
            >
              Skip All Today
            </button>
            <button
              onClick={() => handleSetDayAttendance(selectedDateStr, true)}
              disabled={savingKey !== null}
              style={{
                fontSize: '0.75rem',
                padding: '0.4rem 0.8rem',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                cursor: 'pointer'
              }}
              title="Mark all 4 meals on this day as attending"
            >
              Attend All Meals
            </button>
          </div>
        </div>

        {/* 7-Day Selector Bar */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
            <span style={{ display: 'inline-block', animation: 'spin 1.5s linear infinite', fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</span>
            <div style={{ fontSize: '0.85rem' }}>Loading meal schedule...</div>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.5rem', marginBottom: '1.75rem' }}>
              {upcomingDays.map((day) => {
                const isSelected = day.dateStr === selectedDateStr;
                const daySkips = MEAL_SLOTS.filter(s => !isAttending(day.dateStr, s.id)).length;

                return (
                  <button
                    key={day.dateStr}
                    onClick={() => setSelectedDateStr(day.dateStr)}
                    style={{
                      background: isSelected 
                        ? 'linear-gradient(135deg, rgba(46, 213, 115, 0.25), rgba(46, 213, 115, 0.08))' 
                        : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected 
                        ? '1px solid var(--primary)' 
                        : '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.6rem 0.4rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? '0 0 15px rgba(46, 213, 115, 0.2)' : 'none'
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: isSelected ? 'var(--primary)' : 'var(--text-secondary)' }}>
                      {day.dayName}
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', margin: '0.15rem 0' }}>
                      {day.formattedDate}
                    </div>
                    <div>
                      {daySkips > 0 ? (
                        <span style={{ fontSize: '0.65rem', background: 'rgba(245, 158, 11, 0.2)', color: 'var(--warning)', padding: '0.1rem 0.4rem', borderRadius: '10px' }}>
                          {daySkips} skipped
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.65rem', color: 'var(--success)' }}>
                          ✓ All attending
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Selected Day's 4 Meal Slots */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>
              Meal Slots for {selectedDayObj.fullWeekday} ({selectedDayObj.formattedDate})
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Click any slot to toggle skip/attend status
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {MEAL_SLOTS.map((slot) => {
              const attending = isAttending(selectedDateStr, slot.id);
              const isActionLoading = savingKey === `${selectedDateStr}-${slot.id}` || savingKey === `day-${selectedDateStr}`;

              return (
                <motion.div
                  key={slot.id}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    background: attending 
                      ? 'rgba(16, 185, 129, 0.05)' 
                      : 'rgba(239, 68, 68, 0.08)',
                    border: attending 
                      ? '1px solid rgba(16, 185, 129, 0.25)' 
                      : '1px solid rgba(239, 68, 68, 0.35)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.4rem' }}>{slot.icon}</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>{slot.label}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{slot.time}</div>
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.6rem',
                          borderRadius: 'var(--radius-full)',
                          background: attending ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: attending ? '#34d399' : '#f87171',
                          textTransform: 'uppercase'
                        }}
                      >
                        {attending ? 'Attending' : 'Skipped'}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.75rem', color: attending ? 'var(--text-secondary)' : '#fca5a5', margin: '0.5rem 0 1rem 0' }}>
                      {attending 
                        ? 'Your portion is reserved in the kitchen batch calculation.' 
                        : '⚠️ You marked skipping. Kitchen prep target is reduced by 1 portion.'}
                    </p>
                  </div>

                  <button
                    onClick={() => handleToggleAttendance(selectedDateStr, slot.id)}
                    disabled={isActionLoading}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      background: attending 
                        ? 'rgba(245, 158, 11, 0.15)' 
                        : 'rgba(16, 185, 129, 0.2)',
                      color: attending ? '#fbbf24' : '#34d399',
                      border: attending 
                        ? '1px solid rgba(245, 158, 11, 0.35)' 
                        : '1px solid rgba(16, 185, 129, 0.4)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isActionLoading 
                      ? 'Updating...' 
                      : attending 
                      ? '✖ I will skip this meal' 
                      : '✓ Mark Attending'}
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </SpotlightCard>

    </div>
  );
}
