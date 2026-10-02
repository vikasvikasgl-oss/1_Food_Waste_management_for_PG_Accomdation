import { useState, useEffect } from 'react';
import SpotlightCard from '../components/SpotlightCard';
import ScrollReveal from '../components/ScrollReveal';
import { 
  getCartRequests, 
  updateCartRequestStatus, 
  toggleCartRequestFrozen, 
  type CartRequest, 
  type User 
} from '../utils/db';
import { motion, AnimatePresence } from 'motion/react';

interface ApproveCartsProps {
  user: User;
  showToast: (msg: string, type?: 'success' | 'danger' | 'warning') => void;
}

export default function ApproveCarts({ user, showToast }: ApproveCartsProps) {
  const [requests, setRequests] = useState<CartRequest[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = () => {
    setLoading(true);
    setError(null);
    getCartRequests()
      .then(data => {
        setRequests(data);
        setLoading(false);
      })
      .catch(err => {
        const msg = err instanceof Error ? err.message : 'Failed to load cart requests.';
        console.error("Failed to load requests", err);
        setError(msg);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await updateCartRequestStatus(id, 'approved', user.name);
      showToast(`Cart request ${id.slice(0, 8)} approved successfully!`, 'success');
      loadRequests();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to approve request.';
      console.error(err);
      showToast(errorMsg, 'danger');
    }
  };
 
  const handleReject = async (id: string) => {
    try {
      await updateCartRequestStatus(id, 'rejected', user.name);
      showToast(`Cart request ${id.slice(0, 8)} rejected.`, 'warning');
      loadRequests();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to reject request.';
      console.error(err);
      showToast(errorMsg, 'danger');
    }
  };
 
  const handleToggleFreeze = async (id: string, currentFrozen: boolean) => {
    try {
      await toggleCartRequestFrozen(id, !currentFrozen);
      showToast(`Request ${id.slice(0, 8)} is now ${!currentFrozen ? 'FROZEN' : 'UNFROZEN'}.`, 'success');
      loadRequests();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to toggle freeze status.';
      console.error(err);
      showToast(errorMsg, 'danger');
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  return (
    <main className="container" style={{ maxWidth: '1000px' }}>
      <ScrollReveal delay={0.05}>
        <section style={{ marginBottom: '2rem' }}>
          <h2>Audit Cart Requests</h2>
          <p>Review submitted resident cart requests, approve or reject meals, and freeze requests to prevent changes.</p>
        </section>
      </ScrollReveal>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', background: 'rgba(255,255,255,0.02)', padding: '0.35rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)', width: 'fit-content' }}>
        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            style={{ 
              borderRadius: 'var(--radius-full)', 
              fontSize: '0.85rem', 
              padding: '0.4rem 1.15rem',
              textTransform: 'capitalize',
              background: 'none',
              border: 'none',
              color: filter === f ? '#fff' : 'var(--text-secondary)',
              position: 'relative',
              boxShadow: 'none'
            }}
          >
            {filter === f && (
              <motion.div
                layoutId="approveFilterActiveBg"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'var(--gradient-primary)',
                  borderRadius: 'var(--radius-full)',
                  zIndex: 0
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              />
            )}
            <span style={{ position: 'relative', zIndex: 1 }}>{f} Carts</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <AnimatePresence mode="popLayout">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ padding: '4rem', textAlign: 'center', background: 'var(--gradient-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'spin 1.5s linear infinite' }}>⏳</div>
              <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Loading Cart Requests...</h3>
              <p style={{ color: 'var(--text-muted)' }}>Retrieving submitted orders from residents.</p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ padding: '3rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-md)', color: '#fff' }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚠️</div>
              <h3 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>Failed to Load Carts</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
              <button onClick={loadRequests} style={{ padding: '0.6rem 1.5rem' }}>Retry</button>
            </motion.div>
          ) : filteredRequests.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ padding: '4rem', textAlign: 'center', background: 'var(--gradient-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}
            >
              No cart requests match the filter criteria.
            </motion.div>
          ) : (
            filteredRequests.map((req, index) => {
              let statusBadge = null;
              if (req.status === 'approved') {
                statusBadge = <span className="badge badge-success">Approved</span>;
              } else if (req.status === 'rejected') {
                statusBadge = <span className="badge badge-danger">Rejected</span>;
              } else {
                statusBadge = <span className="badge badge-warning">Pending</span>;
              }

              return (
                <motion.div
                  key={req.cart_id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: index * 0.04 }}
                >
                  <SpotlightCard glowColor="rgba(16, 185, 129, 0.08)" style={{ padding: '1.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>CART ID: {req.cart_id.toUpperCase()}</span>
                        <h4 style={{ fontSize: '1.15rem', marginTop: '0.2rem' }}>
                          Requested by <strong>{req.user_name}</strong> on {req.date}
                        </h4>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {statusBadge}
                      </div>
                    </div>

                    {/* List of items */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                        {req.items.map(item => (
                          <div 
                            key={item.food_id} 
                            style={{ 
                              background: 'rgba(255, 255, 255, 0.02)', 
                              border: '1px solid rgba(255, 255, 255, 0.04)', 
                              padding: '0.5rem 0.85rem', 
                              borderRadius: 'var(--radius-sm)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem'
                            }}
                          >
                            <div>
                              <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{item.title}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{item.category}</span>
                            </div>
                            <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)' }}>{item.quantity} kg</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        {req.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleApprove(req.cart_id)}
                              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', background: 'var(--success)' }}
                            >
                              ✓ Approve
                            </button>
                            <button 
                              onClick={() => handleReject(req.cart_id)}
                              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', background: 'var(--danger)' }}
                            >
                              ✕ Reject
                            </button>
                          </>
                        )}
                        
                        {req.status === 'approved' && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            ✔️ Approved by {req.approved_by}
                          </span>
                        )}
                        {req.status === 'rejected' && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            ❌ Rejected by {req.approved_by}
                          </span>
                        )}
                      </div>

                      <button 
                        className="secondary"
                        onClick={() => handleToggleFreeze(req.cart_id, req.frozen)}
                        style={{ 
                          padding: '0.4rem 1rem', 
                          fontSize: '0.8rem',
                          borderColor: req.frozen ? 'var(--primary)' : 'var(--border-color)',
                          color: req.frozen ? 'var(--primary)' : '#fff'
                        }}
                      >
                        {req.frozen ? '🔓 Unfreeze Request' : '🔒 Freeze Request'}
                      </button>
                    </div>
                  </SpotlightCard>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
