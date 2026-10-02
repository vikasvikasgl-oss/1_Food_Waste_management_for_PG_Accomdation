import { useState, useEffect } from 'react';
import SpotlightCard from '../components/SpotlightCard';
import ScrollReveal from '../components/ScrollReveal';
import { motion, AnimatePresence } from 'motion/react';
import { 
  getFeedbacks, 
  resolveFeedback, 
  getComplaints, 
  updateComplaintStatus, 
  updateComplaintPriority,
  type Feedback, 
  type Complaint
} from '../utils/db';

interface SupportCenterProps {
  showToast: (msg: string, type?: 'success' | 'danger' | 'warning') => void;
}

export default function SupportCenter({ showToast }: SupportCenterProps) {
  const [activeTab, setActiveTab] = useState<'feedback' | 'complaints'>('feedback');
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load database items
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [feeds, comps] = await Promise.all([getFeedbacks(), getComplaints()]);
      setFeedbacks(feeds);
      setComplaints(comps);
      setLoading(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load support center data.";
      console.error("Failed to load support center data", err);
      setError(msg);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResolveFeedback = async (id: string) => {
    try {
      await resolveFeedback(id);
      showToast("Feedback marked as resolved.", "success");
      loadData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to resolve feedback.";
      console.error(err);
      showToast(errorMsg, "danger");
    }
  };

  const handleStatusChange = async (id: string, status: 'open' | 'in_progress' | 'resolved') => {
    try {
      await updateComplaintStatus(id, status);
      showToast(`Complaint status updated to '${status.replace('_', ' ')}'.`, "success");
      loadData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update status.";
      console.error(err);
      showToast(errorMsg, "danger");
    }
  };

  const handlePriorityChange = async (id: string, priority: 'low' | 'medium' | 'high') => {
    try {
      await updateComplaintPriority(id, priority);
      showToast(`Complaint priority updated to '${priority}'.`, "success");
      loadData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update priority.";
      console.error(err);
      showToast(errorMsg, "danger");
    }
  };

  return (
    <main className="container" style={{ maxWidth: '1100px' }}>
      <ScrollReveal delay={0.05}>
        <section style={{ marginBottom: '2rem' }}>
          <h2>Resident Support Desk</h2>
          <p>Review reviews, suggestions, and file reports submitted by hostel residents, and track ticket resolutions.</p>
        </section>
      </ScrollReveal>

      {/* Navigation toggle */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.03)', padding: '0.4rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', position: 'relative' }}>
        <button 
          onClick={() => setActiveTab('feedback')}
          style={{ 
            flex: 1, 
            borderRadius: 'var(--radius-sm)', 
            background: 'none', 
            border: 'none', 
            color: activeTab === 'feedback' ? '#fff' : 'var(--text-secondary)',
            position: 'relative',
            padding: '0.75rem',
            boxShadow: 'none'
          }}
        >
          {activeTab === 'feedback' && (
            <motion.div
              layoutId="supportCenterTabActiveBg"
              style={{
                position: 'absolute',
                inset: 0,
                background: 'var(--gradient-primary)',
                borderRadius: 'var(--radius-sm)',
                zIndex: 0
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            />
          )}
          <span style={{ position: 'relative', zIndex: 1, fontWeight: 600 }}>💬 User Reviews ({feedbacks.length})</span>
        </button>
        <button 
          onClick={() => setActiveTab('complaints')}
          style={{ 
            flex: 1, 
            borderRadius: 'var(--radius-sm)', 
            background: 'none', 
            border: 'none', 
            color: activeTab === 'complaints' ? '#fff' : 'var(--text-secondary)',
            position: 'relative',
            padding: '0.75rem',
            boxShadow: 'none'
          }}
        >
          {activeTab === 'complaints' && (
            <motion.div
              layoutId="supportCenterTabActiveBg"
              style={{
                position: 'absolute',
                inset: 0,
                background: 'var(--gradient-primary)',
                borderRadius: 'var(--radius-sm)',
                zIndex: 0
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            />
          )}
          <span style={{ position: 'relative', zIndex: 1, fontWeight: 600 }}>⚠️ Complaint Tickets ({complaints.length})</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--gradient-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'spin 1.5s linear infinite' }}>⏳</div>
            <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Loading Support Desk...</h3>
            <p style={{ color: 'var(--text-muted)' }}>Retrieving feedbacks and complaint tickets.</p>
          </div>
        ) : error ? (
          <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-md)', color: '#fff' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚠️</div>
            <h3 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>Failed to Load Support Center</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
            <button onClick={loadData} style={{ padding: '0.6rem 1.5rem' }}>Retry</button>
          </div>
        ) : (
        <AnimatePresence mode="wait">
          {activeTab === 'feedback' ? (
            // Feedbacks List
            <motion.div
              key="feedbacks-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
            >
              {feedbacks.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--gradient-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
                  No feedback submissions received yet.
                </div>
              ) : (
                feedbacks.map((feed, idx) => (
                  <motion.div
                    key={feed.feedback_id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2, delay: idx * 0.04 }}
                  >
                    <SpotlightCard glowColor="rgba(16, 185, 129, 0.06)" style={{ padding: '1.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                        <div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            Target: {feed.target_type} ({feed.target_title})
                          </span>
                          <h4 style={{ fontSize: '1.1rem', marginTop: '0.2rem' }}>Submitted by {feed.user_name} on {feed.date}</h4>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ color: '#ff9000', fontWeight: 'bold', fontSize: '1.1rem' }}>
                            {'★'.repeat(feed.rating)}{'☆'.repeat(5 - feed.rating)}
                          </div>
                          {feed.resolved ? (
                            <span className="badge badge-success">Resolved</span>
                          ) : (
                            <span className="badge badge-warning">Pending</span>
                          )}
                        </div>
                      </div>

                      <p style={{ margin: '0 0 1.25rem 0', color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                        "{feed.comment}"
                      </p>

                      {!feed.resolved && (
                        <button 
                          onClick={() => handleResolveFeedback(feed.feedback_id)}
                          style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                        >
                          ✓ Mark as Resolved
                        </button>
                      )}
                    </SpotlightCard>
                  </motion.div>
                ))
              )}
            </motion.div>
          ) : (
            // Complaints List
            <motion.div
              key="complaints-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
            >
              {complaints.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--gradient-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
                  No complaints filed yet.
                </div>
              ) : (
                complaints.map((comp, idx) => {
                  let priorityColor = 'var(--text-secondary)';
                  if (comp.priority === 'high') priorityColor = 'var(--danger)';
                  else if (comp.priority === 'medium') priorityColor = 'var(--warning)';
                  
                  let statusBadge = null;
                  if (comp.status === 'resolved') {
                    statusBadge = <span className="badge badge-success">Resolved</span>;
                  } else if (comp.status === 'in_progress') {
                    statusBadge = <span className="badge badge-warning">In Progress</span>;
                  } else {
                    statusBadge = <span className="badge badge-danger">Open</span>;
                  }

                  return (
                    <motion.div
                      key={comp.complaint_id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.2, delay: idx * 0.04 }}
                    >
                      <SpotlightCard glowColor="rgba(239, 68, 68, 0.05)" style={{ padding: '1.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                          <div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <span className="badge" style={{ background: 'rgba(255,255,255,0.04)', color: priorityColor, border: `1px solid ${priorityColor}40` }}>
                                {comp.priority} priority
                              </span>
                              {statusBadge}
                            </div>
                            <h3 style={{ fontSize: '1.25rem', marginTop: '0.4rem', color: '#fff' }}>{comp.subject}</h3>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                              Filed by {comp.user_name} on {comp.date}
                            </span>
                          </div>
                        </div>

                        <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                          {comp.description}
                        </p>

                        {/* Controls Row */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status:</span>
                            <select 
                              value={comp.status}
                              onChange={e => handleStatusChange(comp.complaint_id, e.target.value as any)}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', width: '130px' }}
                            >
                              <option value="open">Open</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                            </select>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Priority:</span>
                            <select 
                              value={comp.priority}
                              onChange={e => handlePriorityChange(comp.complaint_id, e.target.value as any)}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', width: '130px' }}
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                          </div>
                        </div>
                      </SpotlightCard>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
        )}
      </div>
    </main>
  );
}
