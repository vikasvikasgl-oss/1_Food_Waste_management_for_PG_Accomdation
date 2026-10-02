import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import SpotlightCard from '../components/SpotlightCard';
import ScrollReveal from '../components/ScrollReveal';
import {
  getDonations,
  createDonation,
  deleteDonation,
  getNGOs,
  createNGO,
  deleteNGO,
  getFoodItems,
  type Donation,
  type NGO,
  type FoodItem,
  type User
} from '../utils/db';

interface DonationsProps {
  user: User;
  showToast?: (msg: string, type?: 'success' | 'danger' | 'warning') => void;
}

export default function Donations({ user, showToast }: DonationsProps) {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Donation Form State
  const [selectedItem, setSelectedItem] = useState('');
  const [customItem, setCustomItem] = useState('');
  const [quantityKg, setQuantityKg] = useState('');
  const [selectedNgoId, setSelectedNgoId] = useState('');
  const [customNgoName, setCustomNgoName] = useState('');
  const [donationDate, setDonationDate] = useState(new Date().toISOString().split('T')[0]);
  const [donationNotes, setDonationNotes] = useState('');
  const [submittingDonation, setSubmittingDonation] = useState(false);

  // New NGO Form Modal / Toggle
  const [showAddNgoModal, setShowAddNgoModal] = useState(false);
  const [newNgoName, setNewNgoName] = useState('');
  const [newNgoContact, setNewNgoContact] = useState('');
  const [newNgoPhone, setNewNgoPhone] = useState('');
  const [newNgoEmail, setNewNgoEmail] = useState('');
  const [newNgoAddress, setNewNgoAddress] = useState('');
  const [savingNgo, setSavingNgo] = useState(false);

  // Active Tab within Donations page: 'log_donation' | 'ngo_directory'
  const [activeTab, setActiveTab] = useState<'log_donation' | 'ngo_directory'>('log_donation');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [donationsData, ngosData, foodsData] = await Promise.all([
        getDonations(),
        getNGOs(),
        getFoodItems()
      ]);
      setDonations(donationsData);
      setNgos(ngosData);
      setFoodItems(foodsData);
      if (ngosData.length > 0 && !selectedNgoId) {
        setSelectedNgoId(ngosData[0].id);
      }
      if (foodsData.length > 0 && !selectedItem) {
        setSelectedItem(foodsData[0].title);
      }
      setLoading(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load donations data.';
      console.error('Failed to load donations data', err);
      setError(msg);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Summary Metrics
  const totalDonatedKg = useMemo(() => {
    return Math.round(donations.reduce((sum, d) => sum + d.quantity_kg, 0) * 10) / 10;
  }, [donations]);

  const totalMealsProvided = useMemo(() => {
    return Math.round(totalDonatedKg * 2.2); // standard 450g meal portion
  }, [totalDonatedKg]);

  const activePartnerCount = useMemo(() => {
    return ngos.length;
  }, [ngos]);

  // Handle Log Surplus Donation Submit
  const handleLogDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(quantityKg);
    const finalItem = selectedItem === 'custom' ? customItem.trim() : selectedItem.trim();
    
    let finalNgoName = '';
    if (selectedNgoId === 'custom') {
      finalNgoName = customNgoName.trim();
    } else {
      const found = ngos.find(n => n.id === selectedNgoId);
      finalNgoName = found ? found.name : customNgoName.trim();
    }

    if (!finalItem || isNaN(qty) || qty <= 0 || !finalNgoName) {
      if (showToast) showToast('Please enter a valid food item, quantity (kg), and recipient NGO.', 'danger');
      return;
    }

    setSubmittingDonation(true);
    try {
      const created = await createDonation({
        item: finalItem,
        quantity_kg: qty,
        recipient_ngo: finalNgoName,
        ngo_id: selectedNgoId !== 'custom' ? selectedNgoId : '',
        date: donationDate || new Date().toISOString().split('T')[0],
        notes: donationNotes.trim(),
        logged_by: user.name || 'Manager'
      });

      setDonations(prev => [created, ...prev]);
      setQuantityKg('');
      setCustomItem('');
      setCustomNgoName('');
      setDonationNotes('');
      if (showToast) {
        showToast(`Successfully logged ${qty} kg surplus ${finalItem} donated to ${finalNgoName}!`, 'success');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to log donation.';
      console.error(err);
      if (showToast) showToast(msg, 'danger');
    } finally {
      setSubmittingDonation(false);
    }
  };

  // Handle Save New NGO
  const handleCreateNGO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNgoName.trim()) {
      if (showToast) showToast('Please enter an NGO partner name.', 'danger');
      return;
    }

    setSavingNgo(true);
    try {
      const created = await createNGO({
        name: newNgoName.trim(),
        contact_person: newNgoContact.trim(),
        phone: newNgoPhone.trim(),
        email: newNgoEmail.trim(),
        address: newNgoAddress.trim()
      });

      setNgos(prev => [...prev, created]);
      setSelectedNgoId(created.id);
      setNewNgoName('');
      setNewNgoContact('');
      setNewNgoPhone('');
      setNewNgoEmail('');
      setNewNgoAddress('');
      setShowAddNgoModal(false);
      if (showToast) showToast(`Added '${created.name}' to saved recipient NGOs!`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save NGO.';
      console.error(err);
      if (showToast) showToast(msg, 'danger');
    } finally {
      setSavingNgo(false);
    }
  };

  // Handle Delete NGO
  const handleDeleteNGO = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove '${name}' from saved NGOs?`)) return;
    try {
      await deleteNGO(id);
      setNgos(prev => prev.filter(n => n.id !== id));
      if (selectedNgoId === id) {
        setSelectedNgoId(ngos.find(n => n.id !== id)?.id || 'custom');
      }
      if (showToast) showToast(`Removed '${name}' from saved NGOs.`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete NGO.';
      console.error(err);
      if (showToast) showToast(msg, 'danger');
    }
  };

  // Handle Delete Donation
  const handleDeleteDonation = async (id: string, item: string) => {
    if (!window.confirm(`Are you sure you want to delete the donation record for '${item}'?`)) return;
    try {
      await deleteDonation(id);
      setDonations(prev => prev.filter(d => d.id !== id));
      if (showToast) showToast('Donation record deleted.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete donation.';
      console.error(err);
      if (showToast) showToast(msg, 'danger');
    }
  };

  return (
    <main className="container" style={{ maxWidth: '1300px', paddingBottom: '4rem' }}>
      
      {/* Header Section */}
      <ScrollReveal delay={0.05}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '0.35rem 0.8rem', borderRadius: 'var(--radius-full)', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              <span>🤝 Surplus Food Redistribution</span>
            </div>
            <h2 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>Surplus Food Donations & Partner NGOs</h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              Log food donations to registered NGOs and community kitchens. Donated surplus is counted separately from wasted food, feeding hungry communities while keeping landfills clean.
            </p>
          </div>

          {/* Sub-view switcher */}
          <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.04)', padding: '0.35rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setActiveTab('log_donation')}
              style={{
                padding: '0.45rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                background: activeTab === 'log_donation' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'log_donation' ? '#000' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer'
              }}
            >
              🍱 Log Surplus Donation
            </button>
            <button
              onClick={() => setActiveTab('ngo_directory')}
              style={{
                padding: '0.45rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                background: activeTab === 'ngo_directory' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'ngo_directory' ? '#000' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer'
              }}
            >
              🏢 Recipient NGOs ({ngos.length})
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* KPI Ribbon */}
      <ScrollReveal delay={0.08}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          <SpotlightCard glowColor="rgba(16, 185, 129, 0.15)" style={{ padding: '1.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Surplus Donated</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary)' }}>{totalDonatedKg}</span>
              <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>kg</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.35rem', display: 'block' }}>
              ✨ 100% diverted from hostel waste
            </span>
          </SpotlightCard>

          <SpotlightCard glowColor="rgba(255, 144, 0, 0.15)" style={{ padding: '1.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Meals Provided</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--secondary)' }}>{totalMealsProvided}</span>
              <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>meals</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
              🍲 Served to underprivileged communities
            </span>
          </SpotlightCard>

          <SpotlightCard glowColor="rgba(59, 130, 246, 0.15)" style={{ padding: '1.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Partner NGOs</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#38bdf8' }}>{activePartnerCount}</span>
              <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>verified</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
              🚚 Ready for daily / weekly surplus pickup
            </span>
          </SpotlightCard>

          <SpotlightCard glowColor="rgba(168, 85, 247, 0.15)" style={{ padding: '1.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Donation Entries</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#c084fc' }}>{donations.length}</span>
              <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>batches</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
              📋 Fully recorded & audited
            </span>
          </SpotlightCard>
        </div>
      </ScrollReveal>

      {/* Loading & Error State */}
      {loading ? (
        <div style={{ padding: '5rem 2rem', textAlign: 'center', background: 'var(--gradient-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'spin 1.5s linear infinite' }}>⏳</div>
          <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Loading Donation & NGO Records...</h3>
          <p style={{ color: 'var(--text-muted)' }}>Retrieving surplus food logs and partner registry.</p>
        </div>
      ) : error ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-md)', color: '#fff', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚠️</div>
          <h3 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>Failed to Load Donations Data</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
          <button onClick={loadData} style={{ padding: '0.6rem 1.5rem' }}>Retry</button>
        </div>
      ) : (
        <>
          {activeTab === 'log_donation' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 420px) 1fr', gap: '2rem', alignItems: 'start' }}>
              
              {/* Left Side: Log Donation Form */}
              <ScrollReveal delay={0.1}>
                <SpotlightCard glowColor="rgba(16, 185, 129, 0.15)" style={{ padding: '2rem' }}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>🍱</span> Log Surplus Food Donation
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    Record excess fresh cooked food given to NGOs.
                  </p>

                  <form onSubmit={handleLogDonation} style={{ border: 'none', background: 'transparent', padding: 0 }}>
                    {/* Food Item Selection */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                        Food Item
                      </label>
                      <select
                        value={selectedItem}
                        onChange={e => setSelectedItem(e.target.value)}
                        style={{ width: '100%', marginBottom: selectedItem === 'custom' ? '0.5rem' : 0 }}
                      >
                        {foodItems.map(f => (
                          <option key={f.food_id} value={f.title}>{f.title} ({f.category})</option>
                        ))}
                        <option value="custom">-- Custom Food Item --</option>
                      </select>

                      {selectedItem === 'custom' && (
                        <input
                          type="text"
                          placeholder="Enter custom food name..."
                          value={customItem}
                          onChange={e => setCustomItem(e.target.value)}
                          required
                          style={{ width: '100%', marginTop: '0.5rem' }}
                        />
                      )}
                    </div>

                    {/* Quantity in KG */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                        Quantity Donated (kg)
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        placeholder="e.g. 15.0"
                        required
                        value={quantityKg}
                        onChange={e => setQuantityKg(e.target.value)}
                        style={{ width: '100%' }}
                      />
                    </div>

                    {/* Recipient NGO Selection */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Recipient NGO</label>
                        <button
                          type="button"
                          onClick={() => setShowAddNgoModal(true)}
                          style={{ fontSize: '0.75rem', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0 }}
                        >
                          + Add New Partner
                        </button>
                      </div>

                      <select
                        value={selectedNgoId}
                        onChange={e => setSelectedNgoId(e.target.value)}
                        style={{ width: '100%' }}
                      >
                        {ngos.map(n => (
                          <option key={n.id} value={n.id}>{n.name}</option>
                        ))}
                        <option value="custom">-- Other / Unregistered NGO --</option>
                      </select>

                      {selectedNgoId === 'custom' && (
                        <input
                          type="text"
                          placeholder="Enter recipient charity or NGO name..."
                          value={customNgoName}
                          onChange={e => setCustomNgoName(e.target.value)}
                          required
                          style={{ width: '100%', marginTop: '0.5rem' }}
                        />
                      )}
                    </div>

                    {/* Date */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                        Donation Date
                      </label>
                      <input
                        type="date"
                        required
                        value={donationDate}
                        onChange={e => setDonationDate(e.target.value)}
                        style={{ width: '100%' }}
                      />
                    </div>

                    {/* Notes */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                        Notes / Batch Details (Optional)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Packed in food-grade foil containers, collected at 3 PM..."
                        value={donationNotes}
                        onChange={e => setDonationNotes(e.target.value)}
                        style={{ width: '100%', resize: 'vertical' }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingDonation}
                      style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem' }}
                    >
                      {submittingDonation ? 'Logging Donation...' : 'Record Surplus Donation'}
                    </button>
                  </form>
                </SpotlightCard>
              </ScrollReveal>

              {/* Right Side: Donation History Ledger Table */}
              <ScrollReveal delay={0.15}>
                <SpotlightCard glowColor="rgba(59, 130, 246, 0.1)" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>📋 Food Donations Ledger</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                        All historical surplus redistribution records.
                      </p>
                    </div>
                  </div>

                  {/* Desktop Table View */}
                  <div className="table-wrapper hidden md:block">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Food Item</th>
                          <th>Donated</th>
                          <th>Recipient NGO</th>
                          <th>Notes</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {donations.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                              No food donations logged yet. Use the form on the left to record your first surplus donation!
                            </td>
                          </tr>
                        ) : (
                          donations.map(don => (
                            <tr key={don.id}>
                              <td><b>{don.date}</b></td>
                              <td><strong style={{ color: '#fff' }}>{don.item}</strong></td>
                              <td><span className="badge badge-success" style={{ fontSize: '0.85rem' }}>🎁 {don.quantity_kg} kg</span></td>
                              <td><span style={{ color: '#60a5fa', fontWeight: 600 }}>{don.recipient_ngo}</span></td>
                              <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '200px' }}>
                                {don.notes || '—'}
                              </td>
                              <td>
                                <button
                                  className="btn-delete"
                                  aria-label={`Delete donation of ${don.item} to ${don.recipient_ngo}`}
                                  style={{ minHeight: '44px' }}
                                  onClick={() => handleDeleteDonation(don.id, don.item)}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card Stack View (< 768px) */}
                  <div className="block md:hidden space-y-3">
                    {donations.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)', background: 'var(--gradient-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                        No food donations logged yet. Use the form above to record surplus donation!
                      </div>
                    ) : (
                      donations.map(don => (
                        <div 
                          key={don.id}
                          style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            padding: '1.25rem'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                            <div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{don.date}</span>
                              <h4 style={{ margin: '0.15rem 0', fontSize: '1.15rem', color: '#fff' }}>{don.item}</h4>
                            </div>
                            <span className="badge badge-success">🎁 {don.quantity_kg} kg</span>
                          </div>

                          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Recipient Charity / NGO:</span>
                            <strong style={{ color: '#60a5fa' }}>{don.recipient_ngo}</strong>
                            {don.notes && (
                              <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                <em>Notes:</em> {don.notes}
                              </p>
                            )}
                          </div>

                          <button
                            className="btn-delete"
                            aria-label={`Delete donation of ${don.item}`}
                            style={{ width: '100%', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => handleDeleteDonation(don.id, don.item)}
                          >
                            🗑️ Delete Record
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </SpotlightCard>
              </ScrollReveal>

            </div>
          ) : (
            /* NGO Partner Directory Tab */
            <div>
              <ScrollReveal delay={0.1}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>Saved Recipient NGOs Registry</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                      Manage verified charities, NGOs, and food banks for recurring food surplus pick-up.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddNgoModal(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}
                  >
                    <span>➕</span>
                    <span>Add Partner NGO</span>
                  </button>
                </div>
              </ScrollReveal>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {ngos.map(ngo => (
                  <ScrollReveal key={ngo.id}>
                    <SpotlightCard glowColor="rgba(59, 130, 246, 0.12)" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                        <span className="badge badge-success">Active Partner</span>
                        <button
                          onClick={() => handleDeleteNGO(ngo.id, ngo.name)}
                          style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '0.8rem', cursor: 'pointer', padding: '0.2rem' }}
                          title="Remove NGO"
                        >
                          ✕ Remove
                        </button>
                      </div>

                      <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: '0 0 0.75rem 0' }}>
                        {ngo.name}
                      </h4>

                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.25rem' }}>
                        {ngo.contact_person && (
                          <div style={{ marginBottom: '0.35rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Contact: </span>
                            <strong>{ngo.contact_person}</strong>
                          </div>
                        )}
                        {ngo.phone && (
                          <div style={{ marginBottom: '0.35rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Phone: </span>
                            <a href={`tel:${ngo.phone}`} style={{ color: 'var(--primary)' }}>{ngo.phone}</a>
                          </div>
                        )}
                        {ngo.email && (
                          <div style={{ marginBottom: '0.35rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Email: </span>
                            <a href={`mailto:${ngo.email}`} style={{ color: '#60a5fa' }}>{ngo.email}</a>
                          </div>
                        )}
                        {ngo.address && (
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Address: </span>
                            <span>{ngo.address}</span>
                          </div>
                        )}
                      </div>

                      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <span>Donations logged:</span>
                        <strong style={{ color: 'var(--primary)' }}>
                          {donations.filter(d => d.recipient_ngo === ngo.name || d.ngo_id === ngo.id).length} batches
                        </strong>
                      </div>
                    </SpotlightCard>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Partner NGO Modal */}
      <AnimatePresence>
        {showAddNgoModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ width: '100%', maxWidth: '520px' }}
            >
              <SpotlightCard glowColor="rgba(46, 213, 115, 0.2)" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>🏢 Register New Recipient NGO</h3>
                  <button
                    onClick={() => setShowAddNgoModal(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateNGO} style={{ border: 'none', background: 'transparent', padding: 0 }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                      NGO Organization Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Robin Hood Army, Feeding India..."
                      required
                      value={newNgoName}
                      onChange={e => setNewNgoName(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                        Contact Person
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Ananya Sharma"
                        value={newNgoContact}
                        onChange={e => setNewNgoContact(e.target.value)}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. +91 98765 43210"
                        value={newNgoPhone}
                        onChange={e => setNewNgoPhone(e.target.value)}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. contact@charity.org"
                      value={newNgoEmail}
                      onChange={e => setNewNgoEmail(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                      Pickup Address / Area
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Koramangala 5th Block, Bangalore"
                      value={newNgoAddress}
                      onChange={e => setNewNgoAddress(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowAddNgoModal(false)}
                      style={{ padding: '0.6rem 1.25rem', background: 'transparent', border: '1px solid var(--border-color)', color: '#fff' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingNgo}
                      style={{ padding: '0.6rem 1.5rem' }}
                    >
                      {savingNgo ? 'Saving...' : 'Save Partner NGO'}
                    </button>
                  </div>
                </form>
              </SpotlightCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}
