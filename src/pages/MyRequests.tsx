import { useState, useEffect } from 'react';
import SpotlightCard from '../components/SpotlightCard';
import ScrollReveal from '../components/ScrollReveal';
import { getCartRequests, type CartRequest, type User } from '../utils/db';

interface MyRequestsProps {
  user: User;
}

export default function MyRequests({ user }: MyRequestsProps) {
  const [requests, setRequests] = useState<CartRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = () => {
    setLoading(true);
    setError(null);
    getCartRequests()
      .then(allReqs => {
        // Backend already filters by user role, but keeping fallback safety
        const userReqs = user.role === 'manager' ? allReqs : allReqs.filter(r => r.user_id === user.user_id);
        setRequests(userReqs);
        setLoading(false);
      })
      .catch(err => {
        const msg = err instanceof Error ? err.message : "Failed to load meal requests.";
        console.error("Failed to load user requests", err);
        setError(msg);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadRequests();
  }, [user]);

  return (
    <main className="container" style={{ maxWidth: '1000px' }}>
      <ScrollReveal delay={0.05}>
        <section style={{ marginBottom: '2rem' }}>
          <h2>My Meal Requests</h2>
          <p>Track the approval status and contents of your submitted food requests.</p>
        </section>
      </ScrollReveal>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--gradient-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'spin 1.5s linear infinite' }}>⏳</div>
          <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Loading Your Requests...</h3>
          <p style={{ color: 'var(--text-muted)' }}>Fetching your recent orders from the server.</p>
        </div>
      ) : error ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-md)', color: '#fff' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚠️</div>
          <h3 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>Failed to Load Requests</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
          <button onClick={loadRequests} style={{ padding: '0.6rem 1.5rem' }}>Retry</button>
        </div>
      ) : requests.length === 0 ? (
        <ScrollReveal delay={0.1}>
          <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--gradient-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
            <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>No Requests Found</h3>
            <p>You haven't submitted any food requests yet. Go to "Order Food" to get started.</p>
          </div>
        </ScrollReveal>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {requests.map((req, index) => {
            let statusBadge = null;
            if (req.status === 'approved') {
              statusBadge = <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>Approved</span>;
            } else if (req.status === 'rejected') {
              statusBadge = <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>Rejected</span>;
            } else {
              statusBadge = <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>Pending</span>;
            }

            return (
              <ScrollReveal key={req.cart_id} delay={0.05 * index}>
                <SpotlightCard glowColor="rgba(255, 75, 43, 0.05)" style={{ padding: '2rem' }}>
                  {/* Top Row: Date, ID, Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>REQUEST ID: {req.cart_id.toUpperCase()}</span>
                      <h4 style={{ fontSize: '1.2rem', marginTop: '0.25rem' }}>Submitted on {req.date}</h4>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {req.frozen && (
                        <span 
                          style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.35rem', 
                            fontSize: '0.8rem', 
                            color: 'var(--text-muted)', 
                            background: 'rgba(255, 255, 255, 0.04)', 
                            padding: '0.25rem 0.6rem', 
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-color)' 
                          }}
                          title="This request is frozen by the manager and cannot be modified."
                        >
                          🔒 Frozen
                        </span>
                      )}
                      {statusBadge}
                    </div>
                  </div>

                  {/* Mid Row: List of Items */}
                  <div style={{ marginBottom: '1rem' }}>
                    <h5 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Items Requested</h5>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      {req.items.map(item => (
                        <div key={item.food_id} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                          <span style={{ fontWeight: 600, display: 'block', color: '#fff' }}>{item.title}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Category: {item.category}</span>
                          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)', display: 'block', marginTop: '0.25rem' }}>{item.quantity} kg</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Row: Approval Info */}
                  {req.status === 'approved' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.9rem' }}>
                      <span>✔️</span>
                      <span>Approved by <strong>{req.approved_by || 'Mess Manager'}</strong></span>
                    </div>
                  )}
                  {req.status === 'rejected' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.9rem' }}>
                      <span>❌</span>
                      <span>This request was rejected by <strong>{req.approved_by || 'Mess Manager'}</strong></span>
                    </div>
                  )}
                </SpotlightCard>
              </ScrollReveal>
            );
          })}
        </div>
      )}
    </main>
  );
}
