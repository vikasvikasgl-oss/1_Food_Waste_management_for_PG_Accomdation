import { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import type { ScriptableContext } from 'chart.js';
import { Line } from 'react-chartjs-2';
import SpotlightCard from '../components/SpotlightCard';
import ScrollReveal from '../components/ScrollReveal';
import DishQualityDashboard from '../components/DishQualityDashboard';
import { getFoodItems, type FoodItem, type LogEntry } from '../utils/db';

// Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ReportsProps {
  logs: LogEntry[];
  onDeleteLog: (id: string) => void;
}

export default function Reports({ logs, onDeleteLog }: ReportsProps) {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  
  // Editable CO2 equivalent factor (default 2.5 kg CO2e per kg food waste)
  const [co2FactorPerKg, setCo2FactorPerKg] = useState<number>(2.5);

  // Monthly waste reduction target set by the manager (default 40 kg per month)
  const [monthlyTargetKg, setMonthlyTargetKg] = useState<number>(() => {
    const saved = localStorage.getItem('manager_monthly_target_kg');
    return saved ? parseFloat(saved) : 40;
  });

  const [isEditingTarget, setIsEditingTarget] = useState<boolean>(false);
  const [tempTarget, setTempTarget] = useState<string>(monthlyTargetKg.toString());

  // Fetch food items to get live cost_per_kg
  useEffect(() => {
    getFoodItems()
      .then(items => setFoodItems(items))
      .catch(err => console.error('Failed to fetch food items for cost analysis', err));
  }, []);

  // Map item title to cost_per_kg (default ₹120/kg fallback)
  const itemCostMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of foodItems) {
      const price = typeof item.cost_per_kg === 'number' && item.cost_per_kg > 0 
        ? item.cost_per_kg 
        : 120;
      map.set(item.title.trim().toLowerCase(), price);
    }
    return map;
  }, [foodItems]);

  const getItemCost = (title: string): number => {
    return itemCostMap.get(title.trim().toLowerCase()) || 120;
  };

  // 1. Core Waste, Donation & Financial Calculations
  const totalPrepared = useMemo(() => logs.reduce((sum, log) => sum + log.prepared, 0), [logs]);
  const totalDonated = useMemo(() => logs.reduce((sum, log) => sum + (log.donated || 0), 0), [logs]);
  // Wasted = Prepared - Consumed - Donated
  const totalWasted = useMemo(() => logs.reduce((sum, log) => sum + (typeof log.wasted === 'number' ? log.wasted : Math.max(0, log.prepared - log.consumed - (log.donated || 0))), 0), [logs]);
  const wasteRatio = totalPrepared > 0 ? (totalWasted / totalPrepared) * 100 : 0;

  // Total Financial Cost of Waste in INR
  const totalWasteCostINR = useMemo(() => {
    return logs.reduce((sum, log) => {
      const costPerKg = getItemCost(log.item);
      const wastedMass = typeof log.wasted === 'number' ? log.wasted : Math.max(0, log.prepared - log.consumed - (log.donated || 0));
      return sum + (wastedMass * costPerKg);
    }, 0);
  }, [logs, itemCostMap]);

  // Total CO2 Equivalent Impact
  const totalCo2EquivalentKg = useMemo(() => {
    return Math.round(totalWasted * co2FactorPerKg * 10) / 10;
  }, [totalWasted, co2FactorPerKg]);

  // 2. Current Month Target Progress
  const currentMonthLogs = useMemo(() => {
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return logs.filter(log => log.date.startsWith(currentYearMonth));
  }, [logs]);

  const currentMonthWasted = useMemo(() => {
    return Math.round(currentMonthLogs.reduce((sum, log) => sum + (typeof log.wasted === 'number' ? log.wasted : Math.max(0, log.prepared - log.consumed - (log.donated || 0))), 0) * 10) / 10;
  }, [currentMonthLogs]);

  const targetProgressPercent = monthlyTargetKg > 0 
    ? Math.min(100, Math.round((currentMonthWasted / monthlyTargetKg) * 100)) 
    : 0;

  const isTargetExceeded = currentMonthWasted > monthlyTargetKg;
  const remainingBudgetKg = Math.max(0, Math.round((monthlyTargetKg - currentMonthWasted) * 10) / 10);

  // 3. Week-Over-Week (WoW) Change Calculation
  const wowMetrics = useMemo(() => {
    const sorted = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (sorted.length === 0) {
      return { currentWeek: 0, priorWeek: 0, changePercent: 0, diffKg: 0 };
    }

    const latestDate = new Date(sorted[0].date).getTime();
    const sevenDaysMs = 7 * 24 * 3600 * 1000;
    const fourteenDaysMs = 14 * 24 * 3600 * 1000;

    const currentWeekLogs = sorted.filter(l => {
      const time = new Date(l.date).getTime();
      return time <= latestDate && time > latestDate - sevenDaysMs;
    });

    const priorWeekLogs = sorted.filter(l => {
      const time = new Date(l.date).getTime();
      return time <= latestDate - sevenDaysMs && time > latestDate - fourteenDaysMs;
    });

    const currentWeek = Math.round(currentWeekLogs.reduce((sum, l) => sum + (typeof l.wasted === 'number' ? l.wasted : Math.max(0, l.prepared - l.consumed - (l.donated || 0))), 0) * 10) / 10;
    const priorWeek = Math.round(priorWeekLogs.reduce((sum, l) => sum + (typeof l.wasted === 'number' ? l.wasted : Math.max(0, l.prepared - l.consumed - (l.donated || 0))), 0) * 10) / 10;
    const diffKg = Math.round((currentWeek - priorWeek) * 10) / 10;
    
    let changePercent = 0;
    if (priorWeek > 0) {
      changePercent = Math.round(((currentWeek - priorWeek) / priorWeek) * 100 * 10) / 10;
    }

    return { currentWeek, priorWeek, changePercent, diffKg };
  }, [logs]);

  // 4. Save Target Handler
  const handleSaveTarget = () => {
    const val = parseFloat(tempTarget);
    if (!isNaN(val) && val > 0) {
      setMonthlyTargetKg(val);
      localStorage.setItem('manager_monthly_target_kg', val.toString());
      setIsEditingTarget(false);
    }
  };

  // 5. CSV Export Handler
  const handleExportCSV = () => {
    if (logs.length === 0) return;

    const headers = [
      'Date',
      'Food Item',
      'Prepared (kg)',
      'Consumed (kg)',
      'Donated (kg)',
      'Wasted (kg)',
      'Cost Per Kg (INR)',
      'Waste Cost (INR)',
      'CO2e Factor (kg/kg)',
      'CO2e Impact (kg)'
    ];

    const rows = logs.map(log => {
      const unitCost = getItemCost(log.item);
      const donatedVal = log.donated || 0;
      const wastedVal = typeof log.wasted === 'number' ? log.wasted : Math.max(0, log.prepared - log.consumed - donatedVal);
      const wasteCost = Math.round(wastedVal * unitCost);
      const co2Impact = Math.round(wastedVal * co2FactorPerKg * 10) / 10;
      return [
        `"${log.date}"`,
        `"${log.item.replace(/"/g, '""')}"`,
        log.prepared,
        log.consumed,
        donatedVal,
        wastedVal,
        unitCost,
        wasteCost,
        co2FactorPerKg,
        co2Impact
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `hostel_food_waste_report_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 6. PDF Export Handler (Prints formatted report sheet)
  const handleExportPDF = () => {
    window.print();
  };

  // 7. Chart Configurations
  const sortedLogs = [...logs].reverse();
  
  const chartData = {
    labels: sortedLogs.map(log => log.date),
    datasets: [
      {
        label: 'Prepared (kg)',
        data: sortedLogs.map(log => log.prepared),
        borderColor: '#ff9000',
        backgroundColor: (context: ScriptableContext<'line'>) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(255, 144, 0, 0.25)');
          gradient.addColorStop(1, 'rgba(255, 144, 0, 0.0)');
          return gradient;
        },
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointBackgroundColor: '#ff9000',
        pointHoverRadius: 6
      },
      {
        label: 'Wasted (kg)',
        data: sortedLogs.map(log => log.wasted),
        borderColor: '#ef4444',
        backgroundColor: (context: ScriptableContext<'line'>) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(239, 68, 68, 0.25)');
          gradient.addColorStop(1, 'rgba(239, 68, 68, 0.0)');
          return gradient;
        },
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointBackgroundColor: '#ef4444',
        pointHoverRadius: 6
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#9ca3af',
          font: { family: 'Inter', size: 12 }
        }
      },
      tooltip: {
        backgroundColor: '#111827',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        titleFont: { family: 'Outfit', size: 13 },
        bodyFont: { family: 'Inter', size: 12 }
      }
    },
    scales: {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: {
          color: '#9ca3af',
          font: { family: 'Inter' }
        }
      },
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: {
          color: '#9ca3af',
          font: { family: 'Inter' }
        }
      }
    }
  };

  return (
    <main className="container" style={{ maxWidth: '1300px', paddingBottom: '4rem' }}>
      
      {/* Header & Export Actions Bar */}
      <ScrollReveal delay={0.05}>
        <section id="stats-section" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <h2 id="overview-heading" style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>
                Executive Waste & Financial Analytics
              </h2>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                Comprehensive tracking of food waste mass, financial loss in INR, carbon footprint, monthly targets, and week-over-week efficiency.
              </p>
            </div>

            {/* Export Actions & CO2 Calibration */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* CO2 Factor Editable Control */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🌱 CO2e Factor:</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="10.0"
                  value={co2FactorPerKg}
                  onChange={e => setCo2FactorPerKg(parseFloat(e.target.value) || 2.5)}
                  style={{ width: '60px', padding: '0.2rem 0.4rem', fontSize: '0.85rem', textAlign: 'center' }}
                  title="kg CO2 equivalent generated per 1 kg of discarded food"
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>kg/kg</span>
              </div>

              {/* CSV Export Button */}
              <button
                onClick={handleExportCSV}
                disabled={logs.length === 0}
                aria-label="Export food waste logs to CSV spreadsheet"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.85rem',
                  padding: '0.55rem 1rem',
                  minHeight: '44px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  cursor: logs.length > 0 ? 'pointer' : 'not-allowed'
                }}
              >
                <span>📥</span>
                <span>Export CSV</span>
              </button>

              {/* PDF Export Button */}
              <button
                onClick={handleExportPDF}
                disabled={logs.length === 0}
                aria-label="Export food waste audit report to PDF document"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.85rem',
                  padding: '0.55rem 1rem',
                  minHeight: '44px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#60a5fa',
                  border: '1px solid rgba(59, 130, 246, 0.35)',
                  cursor: logs.length > 0 ? 'pointer' : 'not-allowed'
                }}
              >
                <span>📄</span>
                <span>Export PDF</span>
              </button>
            </div>
          </div>
          
          {/* Main 5 KPI Cards Grid */}
          <div className="data-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            
            {/* Total Wasted Mass */}
            <SpotlightCard id="card-wasted" className="danger" glowColor="rgba(239, 68, 68, 0.15)" style={{ padding: '1.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net Wasted Mass</span>
              <p id="stat-wasted" style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0.5rem 0', color: 'var(--danger)' }}>
                {Math.round(totalWasted * 10) / 10} kg
              </p>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Prepared - Consumed - Donated ({Math.round(wasteRatio * 10) / 10}%)
              </span>
            </SpotlightCard>

            {/* Surplus Food Donated */}
            <SpotlightCard id="card-donated" glowColor="rgba(16, 185, 129, 0.18)" style={{ padding: '1.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Surplus Donated</span>
              <p style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0.5rem 0', color: 'var(--primary)' }}>
                {Math.round(totalDonated * 10) / 10} kg
              </p>
              <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
                🍱 ~{Math.round(totalDonated * 2.2)} meals served to NGOs
              </span>
            </SpotlightCard>

            {/* (1) Cost of Waste in INR */}
            <SpotlightCard id="card-cost" glowColor="rgba(245, 158, 11, 0.18)" style={{ padding: '1.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Financial Loss</span>
              <p style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0.5rem 0', color: '#fbbf24' }}>
                ₹{totalWasteCostINR.toLocaleString('en-IN')}
              </p>
              <span style={{ fontSize: '0.75rem', color: '#fbbf24' }}>
                💰 Live FoodItem cost_per_kg valuation
              </span>
            </SpotlightCard>

            {/* (2) Estimated CO2 Equivalent */}
            <SpotlightCard id="card-co2" glowColor="rgba(59, 130, 246, 0.18)" style={{ padding: '1.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Carbon Footprint</span>
              <p style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0.5rem 0', color: '#60a5fa' }}>
                {totalCo2EquivalentKg} kg CO₂e
              </p>
              <span style={{ fontSize: '0.75rem', color: '#60a5fa' }}>
                🌿 @ {co2FactorPerKg} kg CO₂e / kg food waste
              </span>
            </SpotlightCard>

            {/* (4) Week-Over-Week Change */}
            <SpotlightCard id="card-wow" glowColor={wowMetrics.diffKg <= 0 ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)"} style={{ padding: '1.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Week-Over-Week</span>
              <p style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0.5rem 0', color: wowMetrics.diffKg <= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {wowMetrics.diffKg <= 0 ? '▼' : '▲'} {Math.abs(wowMetrics.changePercent)}%
              </p>
              <span style={{ fontSize: '0.75rem', color: wowMetrics.diffKg <= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {wowMetrics.diffKg <= 0 ? `${Math.abs(wowMetrics.diffKg)} kg less than last week` : `+${wowMetrics.diffKg} kg increase vs last week`}
              </span>
            </SpotlightCard>

          </div>
        </section>
      </ScrollReveal>

      {/* (3) Monthly Waste-Reduction Target with Progress Bar */}
      <ScrollReveal delay={0.1}>
        <section style={{ marginBottom: '2rem' }}>
          <SpotlightCard glowColor="rgba(46, 213, 115, 0.12)" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🎯</span> Monthly Waste-Reduction Target & Allowance
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                  Current month waste: <strong>{currentMonthWasted} kg</strong> / Target cap: <strong>{monthlyTargetKg} kg</strong>
                </p>
              </div>

              {/* Target edit controls */}
              <div>
                {isEditingTarget ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="number"
                      value={tempTarget}
                      onChange={e => setTempTarget(e.target.value)}
                      style={{ width: '80px', padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                      min="1"
                    />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>kg</span>
                    <button onClick={handleSaveTarget} style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem', background: 'var(--primary)', color: '#000' }}>Save</button>
                    <button onClick={() => setIsEditingTarget(false)} style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--border-color)', color: '#fff' }}>Cancel</button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setTempTarget(monthlyTargetKg.toString());
                      setIsEditingTarget(true);
                    }}
                    style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    ✏️ Edit Target ({monthlyTargetKg} kg)
                  </button>
                )}
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div style={{ width: '100%', height: '14px', background: 'rgba(255,255,255,0.06)', borderRadius: 'var(--radius-full)', overflow: 'hidden', position: 'relative', marginBottom: '0.75rem' }}>
              <div
                style={{
                  height: '100%',
                  width: `${targetProgressPercent}%`,
                  background: isTargetExceeded 
                    ? 'linear-gradient(90deg, #ef4444, #dc2626)' 
                    : targetProgressPercent > 80 
                    ? 'linear-gradient(90deg, #f59e0b, #d97706)' 
                    : 'linear-gradient(90deg, #10b981, #059669)',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.5s ease'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
              <span style={{ color: isTargetExceeded ? 'var(--danger)' : targetProgressPercent > 80 ? 'var(--warning)' : 'var(--success)', fontWeight: 600 }}>
                {isTargetExceeded 
                  ? `⚠️ Target Exceeded by ${(currentMonthWasted - monthlyTargetKg).toFixed(1)} kg!` 
                  : `✓ On Track (${targetProgressPercent}% of monthly allowance consumed)`}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>
                {remainingBudgetKg > 0 ? `${remainingBudgetKg} kg remaining allowance this month` : '0 kg budget remaining'}
              </span>
            </div>
          </SpotlightCard>
        </section>
      </ScrollReveal>

      {/* Visual Chart */}
      {logs.length > 0 && (
        <ScrollReveal delay={0.12}>
          <section id="chart-section" style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Food Consumption & Waste Trends</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Visual comparison of kitchen food prepared vs wasted over time.</p>
            <div className="chart-container" style={{ background: 'var(--gradient-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', height: '320px' }}>
              <Line data={chartData} options={chartOptions} />
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* Dish Ratings & Waste Correlation Dashboard */}
      <ScrollReveal delay={0.14}>
        <DishQualityDashboard />
      </ScrollReveal>

      {/* Daily Logs Table with Cost and CO2 Columns */}
      <ScrollReveal delay={0.15}>
        <section id="logs-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', margin: '0 0 0.25rem 0' }}>Detailed Waste Logs Ledger</h2>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Itemized valuation of food prepared, consumed, surplus donated, net wasted mass, financial loss in INR, and carbon impact.</p>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="table-wrapper hidden md:block">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Food Item</th>
                  <th>Prepared</th>
                  <th>Consumed</th>
                  <th>Donated</th>
                  <th>Wasted</th>
                  <th>Cost / kg</th>
                  <th>Loss (INR)</th>
                  <th>CO₂e Impact</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No logged entries available. Please upload records to see data.
                    </td>
                  </tr>
                ) : (
                  logs.map(log => {
                    const ratio = log.prepared > 0 ? (log.wasted / log.prepared) : 0;
                    const unitCost = getItemCost(log.item);
                    const donatedMass = log.donated || 0;
                    const netWasted = typeof log.wasted === 'number' ? log.wasted : Math.max(0, log.prepared - log.consumed - donatedMass);
                    const wasteLoss = Math.round(netWasted * unitCost);
                    const co2Impact = Math.round(netWasted * co2FactorPerKg * 10) / 10;

                    let statusBadge = null;
                    if (ratio > 0.15) {
                      statusBadge = <span className="badge badge-danger">High Waste</span>;
                    } else if (ratio > 0.05) {
                      statusBadge = <span className="badge badge-warning">Moderate</span>;
                    } else {
                      statusBadge = <span className="badge badge-success">Optimal</span>;
                    }

                    return (
                      <tr key={log.id}>
                        <td><b>{log.date}</b></td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            {log.item} {statusBadge}
                          </span>
                        </td>
                        <td>{log.prepared} kg</td>
                        <td>{log.consumed} kg</td>
                        <td style={{ color: donatedMass > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
                          {donatedMass > 0 ? `🎁 ${donatedMass} kg` : '0 kg'}
                        </td>
                        <td>
                          <span style={ratio > 0.15 ? { color: 'var(--danger)', fontWeight: 600 } : { fontWeight: 500 }}>
                            {netWasted} kg
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>
                          ₹{unitCost}/kg
                        </td>
                        <td>
                          <strong style={{ color: wasteLoss > 500 ? '#fbbf24' : '#fff' }}>
                            ₹{wasteLoss.toLocaleString('en-IN')}
                          </strong>
                        </td>
                        <td style={{ color: '#34d399' }}>
                          {co2Impact} kg
                        </td>
                        <td>
                          <button 
                            className="btn-delete" 
                            aria-label={`Delete log for ${log.item} on ${log.date}`}
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete the log for '${log.item}'?`)) {
                                onDeleteLog(log.id);
                              }
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Stack View (< 768px) */}
          <div className="block md:hidden space-y-3.5">
            {logs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: 'var(--gradient-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
                No logged entries available. Please upload records to see data.
              </div>
            ) : (
              logs.map(log => {
                const ratio = log.prepared > 0 ? (log.wasted / log.prepared) : 0;
                const unitCost = getItemCost(log.item);
                const donatedMass = log.donated || 0;
                const netWasted = typeof log.wasted === 'number' ? log.wasted : Math.max(0, log.prepared - log.consumed - donatedMass);
                const wasteLoss = Math.round(netWasted * unitCost);
                const co2Impact = Math.round(netWasted * co2FactorPerKg * 10) / 10;

                let statusBadge = null;
                if (ratio > 0.15) {
                  statusBadge = <span className="badge badge-danger">High Waste</span>;
                } else if (ratio > 0.05) {
                  statusBadge = <span className="badge badge-warning">Moderate</span>;
                } else {
                  statusBadge = <span className="badge badge-success">Optimal</span>;
                }

                return (
                  <SpotlightCard key={log.id} glowColor="rgba(46, 213, 115, 0.1)" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{log.date}</span>
                        <h4 style={{ margin: '0.2rem 0', fontSize: '1.15rem', color: '#fff' }}>{log.item}</h4>
                      </div>
                      <div>{statusBadge}</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.45rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Prepared / Consumed</span>
                        <strong>{log.prepared} kg / {log.consumed} kg</strong>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.45rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Surplus Donated</span>
                        <strong style={{ color: donatedMass > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
                          {donatedMass > 0 ? `🎁 ${donatedMass} kg` : '0 kg'}
                        </strong>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.45rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Net Wasted / Loss</span>
                        <strong style={{ color: ratio > 0.15 ? 'var(--danger)' : '#fbbf24' }}>
                          {netWasted} kg (₹{wasteLoss.toLocaleString('en-IN')})
                        </strong>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.45rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Carbon Impact</span>
                        <strong style={{ color: '#34d399' }}>{co2Impact} kg CO₂e</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                      <button 
                        className="btn-delete" 
                        aria-label={`Delete log entry for ${log.item} on ${log.date}`}
                        style={{ width: '100%', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete the log for '${log.item}'?`)) {
                            onDeleteLog(log.id);
                          }
                        }}
                      >
                        🗑️ Delete Log Entry
                      </button>
                    </div>
                  </SpotlightCard>
                );
              })
            )}
          </div>
        </section>
      </ScrollReveal>
    </main>
  );
}
