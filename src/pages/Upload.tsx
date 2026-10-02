import { useState, useEffect } from 'react';
import SpotlightCard from '../components/SpotlightCard';

interface UploadProps {
  onSaveLog: (log: { item: string; prepared: number; consumed: number; donated?: number; date: string }) => void;
  showToast: (msg: string, type?: 'success' | 'danger' | 'warning') => void;
}

export default function Upload({ onSaveLog, showToast }: UploadProps) {
  const [item, setItem] = useState('');
  const [prepared, setPrepared] = useState('');
  const [consumed, setConsumed] = useState('');
  const [donated, setDonated] = useState('');
  const [date, setDate] = useState('');

  // Default date to today's date
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
  }, []);

  const prepNum = parseFloat(prepared) || 0;
  const consNum = parseFloat(consumed) || 0;
  const donNum = parseFloat(donated) || 0;
  const calcWasted = Math.max(0, prepNum - consNum - donNum);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const preparedNum = parseFloat(prepared);
    const consumedNum = parseFloat(consumed);
    const donatedNum = donated ? parseFloat(donated) : 0;

    if (!item.trim() || isNaN(preparedNum) || isNaN(consumedNum) || isNaN(donatedNum) || !date) {
      showToast("Please fill in all details correctly.", "danger");
      return;
    }

    if (consumedNum + donatedNum > preparedNum) {
      showToast("Consumed + Donated quantity cannot exceed prepared quantity!", "danger");
      return;
    }

    onSaveLog({
      item: item.trim(),
      prepared: preparedNum,
      consumed: consumedNum,
      donated: donatedNum,
      date: date
    });

    showToast(`Food record for '${item}' saved successfully! Wasted: ${Math.round((preparedNum - consumedNum - donatedNum) * 10) / 10} kg.`, "success");
    setItem('');
    setPrepared('');
    setConsumed('');
    setDonated('');
    
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <main className="container" style={{ maxWidth: '800px' }}>
      <SpotlightCard id="upload-section" style={{ padding: '2.5rem' }}>
        <h2 id="form-heading" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Enter Daily Food Log</h2>
        <p style={{ marginBottom: '1.75rem', color: 'var(--text-secondary)' }}>
          Log food prepared, consumed, and surplus donated to NGOs. Discarded waste is automatically computed as: <strong style={{ color: '#fff' }}>Wasted = Prepared - Consumed - Donated</strong>.
        </p>
        
        <form id="upload-form" onSubmit={handleSubmit} style={{ border: 'none', background: 'transparent', padding: 0, maxWidth: '100%' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="upload-item" style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Food Item Name</label>
            <input 
              type="text" 
              id="upload-item" 
              placeholder="e.g., Veg Biryani, Paneer Butter Masala, Roti" 
              required 
              value={item}
              onChange={(e) => setItem(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label htmlFor="upload-prepared" style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Prepared (kg)</label>
              <input 
                type="number" 
                id="upload-prepared" 
                min="0.1" 
                step="0.1" 
                placeholder="e.g., 50.0" 
                required 
                value={prepared}
                onChange={(e) => setPrepared(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label htmlFor="upload-consumed" style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Consumed (kg)</label>
              <input 
                type="number" 
                id="upload-consumed" 
                min="0.0" 
                step="0.1" 
                placeholder="e.g., 42.0" 
                required 
                value={consumed}
                onChange={(e) => setConsumed(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label htmlFor="upload-donated" style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, color: '#34d399' }}>Surplus Donated (kg)</label>
              <input 
                type="number" 
                id="upload-donated" 
                min="0.0" 
                step="0.1" 
                placeholder="e.g., 5.0" 
                value={donated}
                onChange={(e) => setDonated(e.target.value)}
                style={{ width: '100%', borderColor: 'rgba(16, 185, 129, 0.4)' }}
              />
            </div>
          </div>

          {/* Live Dynamic Computation Preview */}
          {prepNum > 0 && (
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {prepNum} kg (Prep) - {consNum} kg (Consumed) - {donNum} kg (Donated) =
              </span>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: calcWasted > 0 ? 'var(--danger)' : 'var(--success)' }}>
                {Math.round(calcWasted * 10) / 10} kg Actual Waste
              </span>
            </div>
          )}

          <div style={{ marginBottom: '1.75rem' }}>
            <label htmlFor="upload-date" style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Log Date</label>
            <input 
              type="date" 
              id="upload-date" 
              required 
              max={todayStr}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <button type="submit" id="upload-submit" style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}>
            Save Food Record
          </button>
        </form>
      </SpotlightCard>
    </main>
  );
}
