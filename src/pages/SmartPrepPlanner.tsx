import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import SpotlightCard from '../components/SpotlightCard';
import ScrollReveal from '../components/ScrollReveal';
import {
  getFoodItems,
  getCartRequests,
  getLogs,
  getMealAttendances,
  type FoodItem,
  type CartRequest,
  type LogEntry,
  type MealAttendance
} from '../utils/db';
import {
  computeSmartPrepRecommendations,
  computeWasteComparisonHistory,
  computeHeadcountAdjustment,
  getWeekdayFromDate,
  type ItemPrepRecommendation,
  type WasteComparisonDataPoint
} from '../utils/prepPlanner';

interface SmartPrepPlannerProps {
  showToast?: (msg: string, type?: 'success' | 'danger' | 'warning') => void;
}

const MEAL_SLOT_OPTIONS = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks'];

export default function SmartPrepPlanner({ showToast }: SmartPrepPlannerProps) {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [cartRequests, setCartRequests] = useState<CartRequest[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [attendances, setAttendances] = useState<MealAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Target Date for prep planning (defaults to current date)
  const [targetDate, setTargetDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedSlot, setSelectedSlot] = useState<string>('All');
  const [safetyBufferPercent, setSafetyBufferPercent] = useState<number>(10); // 10%
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [foodsData, cartsData, logsData, attendanceData] = await Promise.all([
        getFoodItems(),
        getCartRequests(),
        getLogs(),
        getMealAttendances()
      ]);
      setFoodItems(foodsData);
      setCartRequests(cartsData);
      setLogs(logsData);
      setAttendances(attendanceData);
      setLoading(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load planner data.';
      console.error('Failed to load planner data', err);
      setError(msg);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute recommendations with Headcount and Skipped Meal Attendance adjustments
  const recommendations: ItemPrepRecommendation[] = useMemo(() => {
    return computeSmartPrepRecommendations(
      foodItems,
      logs,
      cartRequests,
      targetDate,
      safetyBufferPercent / 100,
      attendances,
      50, // Standard baseline capacity
      selectedSlot !== 'All' ? selectedSlot : undefined
    );
  }, [foodItems, logs, cartRequests, targetDate, safetyBufferPercent, attendances, selectedSlot]);

  // Compute Waste comparison data for Recharts
  const chartData: WasteComparisonDataPoint[] = useMemo(() => {
    return computeWasteComparisonHistory(logs);
  }, [logs]);

  // Headcount summary for current date & slot
  const headcountSummary = useMemo(() => {
    return computeHeadcountAdjustment(
      attendances,
      targetDate,
      selectedSlot !== 'All' ? selectedSlot : undefined,
      50
    );
  }, [attendances, targetDate, selectedSlot]);

  // Filtered recommendations
  const filteredRecs = useMemo(() => {
    if (categoryFilter === 'All') return recommendations;
    return recommendations.filter(r => r.category === categoryFilter);
  }, [recommendations, categoryFilter]);

  // Aggregate Metrics
  const totalRecommendedPrep = useMemo(() => {
    return Math.round(recommendations.reduce((sum, r) => sum + r.recommendedPrepQty, 0) * 10) / 10;
  }, [recommendations]);

  const totalCartDemand = useMemo(() => {
    return Math.round(recommendations.reduce((sum, r) => sum + r.approvedCartDemand, 0) * 10) / 10;
  }, [recommendations]);

  const totalPredictedWaste = useMemo(() => {
    return Math.round(recommendations.reduce((sum, r) => sum + r.predictedWasteKg, 0) * 10) / 10;
  }, [recommendations]);

  const avgConfidence = useMemo(() => {
    if (recommendations.length === 0) return 0;
    const sum = recommendations.reduce((acc, r) => acc + r.confidenceScore, 0);
    return Math.round(sum / recommendations.length);
  }, [recommendations]);

  const targetWeekday = getWeekdayFromDate(targetDate);
  const categories = ['All', ...Array.from(new Set(foodItems.map(f => f.category)))];

  const handleApplyPrepToKitchen = (item: ItemPrepRecommendation) => {
    if (showToast) {
      showToast(
        `Kitchen prep target for '${item.title}' set to ${item.recommendedPrepQty} kg (${item.expectedHeadcount} residents expected)!`,
        'success'
      );
    }
  };

  return (
    <main className="container" style={{ maxWidth: '1280px', paddingBottom: '4rem' }}>
      
      {/* Header Section */}
      <ScrollReveal delay={0.05}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(46, 213, 115, 0.1)', border: '1px solid rgba(46, 213, 115, 0.25)', padding: '0.35rem 0.8rem', borderRadius: 'var(--radius-full)', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              <span>⚡ AI Portion Intelligence & Headcount Calibration</span>
            </div>
            <h2 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>Smart Kitchen Prep Planner</h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              Calculates optimal cooking batch sizes by blending <strong>approved resident cart demand</strong> with <strong>historical {targetWeekday} consumption</strong>, scaled by <strong>resident skip attendance headcount</strong>, plus a calibrated <strong>+{safetyBufferPercent}% safety buffer</strong>.
            </p>
          </div>

          {/* Date, Slot & Safety Buffer Controls */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', background: 'rgba(255,255,255,0.02)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Planning Date ({targetWeekday})
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.9rem', width: '160px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Meal Slot
              </label>
              <select
                value={selectedSlot}
                onChange={e => setSelectedSlot(e.target.value)}
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.9rem', width: '130px' }}
              >
                {MEAL_SLOT_OPTIONS.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Safety Buffer: {safetyBufferPercent}%
              </label>
              <input
                type="range"
                min="5"
                max="25"
                step="1"
                value={safetyBufferPercent}
                onChange={e => setSafetyBufferPercent(parseInt(e.target.value))}
                style={{ width: '110px', accentColor: 'var(--primary)' }}
              />
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Loading & Error State */}
      {loading ? (
        <div style={{ padding: '5rem 2rem', textAlign: 'center', background: 'var(--gradient-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'spin 1.5s linear infinite' }}>⏳</div>
          <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Analyzing Log History, Cart Demands & Headcount Attendance...</h3>
          <p style={{ color: 'var(--text-muted)' }}>Calculating optimal prep batches and forecast models.</p>
        </div>
      ) : error ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-md)', color: '#fff', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚠️</div>
          <h3 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>Failed to Load Prep Planner Data</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
          <button onClick={loadData} style={{ padding: '0.6rem 1.5rem' }}>Retry</button>
        </div>
      ) : (
        <>
          {/* Headcount Attendance Live Forecast Banner */}
          <ScrollReveal delay={0.08}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(59, 130, 246, 0.05))',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem 1.5rem',
              marginBottom: '2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem'
                }}>
                  👥
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '1.1rem', color: '#fff' }}>
                    Live Resident Headcount Feed for {targetWeekday} ({selectedSlot === 'All' ? 'All Slots' : selectedSlot})
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {headcountSummary.skippedCount > 0 ? (
                      <span>
                        <strong style={{ color: '#fbbf24' }}>{headcountSummary.skippedCount} residents</strong> marked "I will skip this meal". Batch quantities automatically reduced by <strong>{Math.round((1 - headcountSummary.headcountAdjustmentFactor) * 100)}%</strong>.
                      </span>
                    ) : (
                      <span>
                        Full attendance expected. <strong>{headcountSummary.totalResidents} residents</strong> planned for this meal slot.
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hostel Capacity</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>{headcountSummary.totalResidents}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#fbbf24', textTransform: 'uppercase' }}>Skipped Meals</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fbbf24' }}>{headcountSummary.skippedCount}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary)', textTransform: 'uppercase' }}>Expected Headcount</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>{headcountSummary.expectedHeadcount}</div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Executive Overview KPI Grid */}
          <ScrollReveal delay={0.1}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              <SpotlightCard glowColor="rgba(46, 213, 115, 0.15)" style={{ padding: '1.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recommended Total Prep</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>{totalRecommendedPrep}</span>
                  <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>kg</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--success)', display: 'block', marginTop: '0.5rem' }}>
                  ✨ Headcount-calibrated +{safetyBufferPercent}% buffer
                </span>
              </SpotlightCard>

              <SpotlightCard glowColor="rgba(255, 144, 0, 0.15)" style={{ padding: '1.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Approved Resident Demand</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--secondary)' }}>{totalCartDemand}</span>
                  <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>kg</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>
                  🛒 Direct resident cart orders
                </span>
              </SpotlightCard>

              <SpotlightCard glowColor="rgba(239, 68, 68, 0.15)" style={{ padding: '1.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Predicted Waste Bound</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--danger)' }}>{totalPredictedWaste}</span>
                  <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>kg</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>
                  📉 Maximum safety buffer margin
                </span>
              </SpotlightCard>

              <SpotlightCard glowColor="rgba(59, 130, 246, 0.15)" style={{ padding: '1.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Forecast Confidence</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: '#38bdf8' }}>{avgConfidence}%</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>
                  🎯 Backed by logs & attendance records
                </span>
              </SpotlightCard>
            </div>
          </ScrollReveal>

          {/* Recharts Waste Chart: Actual vs Predicted */}
          <ScrollReveal delay={0.15}>
            <section style={{ marginBottom: '2.5rem', padding: '2rem', background: 'var(--gradient-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.3rem', margin: '0 0 0.25rem 0', color: '#fff' }}>📊 Historical Actual Waste vs Smart Predicted Waste</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                    Comparing kitchen actual waste records with AI-predicted buffer bounds over the last 14 logs.
                  </p>
                </div>
                <span className="badge badge-success">Live Recharts Engine</span>
              </div>

              {chartData.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No historical waste logs recorded yet to render comparative graph.
                </div>
              ) : (
                <div style={{ width: '100%', height: '320px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis 
                        dataKey="date" 
                        stroke="var(--text-muted)" 
                        fontSize={12} 
                        tickLine={false} 
                      />
                      <YAxis 
                        stroke="var(--text-muted)" 
                        fontSize={12} 
                        tickLine={false} 
                        unit="kg" 
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(15, 15, 15, 0.95)', 
                          border: '1px solid rgba(255,255,255,0.15)', 
                          borderRadius: '8px', 
                          color: '#fff',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                        }} 
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '15px' }} 
                        formatter={(value) => <span style={{ color: '#fff', fontSize: '0.85rem' }}>{value}</span>}
                      />
                      <Bar 
                        name="Actual Wasted (kg)" 
                        dataKey="actualWaste" 
                        fill="#ef4444" 
                        radius={[4, 4, 0, 0]} 
                      />
                      <Bar 
                        name="Predicted Buffer Bound (kg)" 
                        dataKey="predictedWaste" 
                        fill="#2ed573" 
                        radius={[4, 4, 0, 0]} 
                      />
                      <Bar 
                        name="Actual Consumed (kg)" 
                        dataKey="actualConsumed" 
                        fill="#38bdf8" 
                        radius={[4, 4, 0, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
          </ScrollReveal>

          {/* Category Filter & Section Title */}
          <ScrollReveal delay={0.2}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', margin: '0 0 0.25rem 0', color: '#fff' }}>🍲 "Prep This Much Today" Recommendations</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  Kitchen cooking batches optimized for {targetWeekday} ({targetDate}) • {headcountSummary.expectedHeadcount} residents attending.
                </p>
              </div>

              {/* Category Pills */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    style={{
                      padding: '0.35rem 0.85rem',
                      fontSize: '0.85rem',
                      borderRadius: 'var(--radius-full)',
                      background: categoryFilter === cat ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.03)',
                      color: categoryFilter === cat ? '#fff' : 'var(--text-secondary)',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Item Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {filteredRecs.map((item, idx) => (
              <ScrollReveal key={item.food_id} delay={0.05 * idx}>
                <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                  <SpotlightCard glowColor="rgba(46, 213, 115, 0.12)" style={{ padding: '1.75rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    
                    {/* Top Row: Category & Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                        {item.category}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: item.status === 'out_of_stock' ? 'var(--danger)' : item.status === 'low_stock' ? 'var(--warning)' : 'var(--success)', fontWeight: 600, textTransform: 'uppercase' }}>
                        In Stock: {item.quantity_available} kg
                      </span>
                    </div>

                    {/* Food Title */}
                    <h4 style={{ fontSize: '1.35rem', margin: '0 0 0.5rem 0', fontWeight: 700, color: '#fff' }}>
                      {item.title}
                    </h4>

                    {/* Headcount adjustment indicator pill */}
                    {item.skippedCount > 0 && (
                      <div style={{ fontSize: '0.75rem', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', display: 'inline-block' }}>
                        ⚡ -{Math.round((1 - item.headcountAdjustmentFactor) * 100)}% prep adjustment ({item.skippedCount} residents skipped)
                      </div>
                    )}

                    {/* Prominent Recommendation Box */}
                    <div style={{ background: 'rgba(46, 213, 115, 0.08)', border: '1px solid rgba(46, 213, 115, 0.25)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.25rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.25rem' }}>
                        Prep This Much for {item.weekday}
                      </span>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '0.35rem' }}>
                        <span style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>
                          {item.recommendedPrepQty}
                        </span>
                        <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>kg</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, marginTop: '0.35rem', display: 'inline-block' }}>
                        +{safetyBufferPercent}% Buffer Included (+{item.safetyBufferKg} kg)
                      </span>
                    </div>

                    {/* Calculation Breakdown Matrix */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Historical {item.weekday}</span>
                        <strong style={{ color: '#fff' }}>{item.historicalWeekdayAvg} kg</strong>
                      </div>

                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Approved Carts</span>
                        <strong style={{ color: 'var(--secondary)' }}>{item.approvedCartDemand} kg ({item.approvedCartCount})</strong>
                      </div>

                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Expected Headcount</span>
                        <strong style={{ color: '#34d399' }}>{item.expectedHeadcount} / {item.totalResidents}</strong>
                      </div>

                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Forecast Accuracy</span>
                        <strong style={{ color: '#38bdf8' }}>{item.confidenceScore}%</strong>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleApplyPrepToKitchen(item)}
                      style={{
                        marginTop: 'auto',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem',
                        fontSize: '0.9rem'
                      }}
                    >
                      <span>👨‍🍳</span>
                      <span>Ready for Kitchen Prep</span>
                    </button>

                  </SpotlightCard>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </>
      )}

    </main>
  );
}
