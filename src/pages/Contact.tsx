import { useState, useEffect } from 'react';
import SpotlightCard from '../components/SpotlightCard';
import ScrollReveal from '../components/ScrollReveal';
import { motion, AnimatePresence } from 'motion/react';
import { 
  createFeedback, 
  createComplaint, 
  getFoodItems, 
  getCartRequests,
  type User,
  type FoodItem,
  type CartRequest
} from '../utils/db';

interface ContactProps {
  user: User | null;
  showToast: (msg: string, type?: 'success' | 'danger' | 'warning') => void;
}

export default function Contact({ user, showToast }: ContactProps) {
  const [formType, setFormType] = useState<'feedback' | 'complaint'>('feedback');
  
  // Feedback Form State
  const [targetType, setTargetType] = useState<'food' | 'system' | 'cart'>('system');
  const [targetId, setTargetId] = useState('system');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  
  // Complaint Form State
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [description, setDescription] = useState('');

  // Database lists for targets
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [userCarts, setUserCarts] = useState<CartRequest[]>([]);

  useEffect(() => {
    getFoodItems()
      .then(data => setFoodItems(data))
      .catch(err => console.error("Failed to load food items", err));
      
    if (user) {
      getCartRequests()
        .then(allCarts => {
          setUserCarts(allCarts.filter(c => c.user_id === user.user_id));
        })
        .catch(err => console.error("Failed to load user carts", err));
    }
  }, [user]);

  // Handle target type change
  useEffect(() => {
    if (targetType === 'system') {
      setTargetId('system');
    } else if (targetType === 'food' && foodItems.length > 0) {
      setTargetId(foodItems[0].food_id);
    } else if (targetType === 'cart' && userCarts.length > 0) {
      setTargetId(userCarts[0].cart_id);
    } else {
      setTargetId('');
    }
  }, [targetType, foodItems, userCarts]);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast("Please register or sign in to submit feedback.", "danger");
      return;
    }

    if (!comment.trim()) {
      showToast("Please fill in feedback comments.", "danger");
      return;
    }

    // Determine target title
    let targetTitle = 'Global System';
    if (targetType === 'food') {
      const food = foodItems.find(f => f.food_id === targetId);
      targetTitle = food ? food.title : 'Food Item';
    } else if (targetType === 'cart') {
      targetTitle = `Cart Request (${targetId.slice(0, 8)})`;
    }

    try {
      await createFeedback({
        user_id: user.user_id,
        user_name: user.name,
        target_type: targetType,
        target_id: targetId,
        target_title: targetTitle,
        rating,
        comment: comment.trim()
      });

      showToast("Feedback submitted successfully. Thank you!", "success");
      setComment('');
      setRating(5);
      setTargetType('system');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to submit feedback.";
      console.error(err);
      showToast(errorMsg, "danger");
    }
  };

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast("Please register or sign in to file a complaint.", "danger");
      return;
    }

    if (!subject.trim() || !description.trim()) {
      showToast("Please fill in the complaint details.", "danger");
      return;
    }

    try {
      await createComplaint({
        user_id: user.user_id,
        user_name: user.name,
        subject: subject.trim(),
        priority,
        description: description.trim()
      });

      showToast("Complaint filed successfully. Support has been notified.", "success");
      setSubject('');
      setDescription('');
      setPriority('medium');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to submit complaint.";
      console.error(err);
      showToast(errorMsg, "danger");
    }
  };

  return (
    <main className="container" style={{ maxWidth: '800px' }}>
      <ScrollReveal delay={0.05}>
        <section style={{ marginBottom: '2.5rem' }}>
          <h2>Help & Support Desk</h2>
          <p>Submit ratings and feedback or file complaints directly with the hostel mess managers.</p>
        </section>
      </ScrollReveal>

      {/* Switch Form Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.03)', padding: '0.4rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', position: 'relative' }}>
        <button 
          onClick={() => setFormType('feedback')}
          style={{ 
            flex: 1, 
            borderRadius: 'var(--radius-sm)', 
            background: 'none', 
            border: 'none', 
            color: formType === 'feedback' ? '#fff' : 'var(--text-secondary)',
            position: 'relative',
            padding: '0.75rem',
            boxShadow: 'none'
          }}
        >
          {formType === 'feedback' && (
            <motion.div
              layoutId="supportTabActiveBg"
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
          <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 600 }}>✍️ Give Feedback</span>
        </button>
        <button 
          onClick={() => setFormType('complaint')}
          style={{ 
            flex: 1, 
            borderRadius: 'var(--radius-sm)', 
            background: 'none', 
            border: 'none', 
            color: formType === 'complaint' ? '#fff' : 'var(--text-secondary)',
            position: 'relative',
            padding: '0.75rem',
            boxShadow: 'none'
          }}
        >
          {formType === 'complaint' && (
            <motion.div
              layoutId="supportTabActiveBg"
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                borderRadius: 'var(--radius-sm)',
                zIndex: 0
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            />
          )}
          <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 600 }}>⚠️ File Complaint</span>
        </button>
      </div>

      <ScrollReveal delay={0.1}>
        <SpotlightCard style={{ padding: '2.5rem' }} glowColor="rgba(255, 75, 43, 0.08)">
          <AnimatePresence mode="wait">
            {formType === 'feedback' ? (
              // Feedback Form Layout
              <motion.div
                key="feedback-form"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.2 }}
              >
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#fff' }}>Submit Feedback</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>Rate specific food items, your order carts, or our system experience.</p>
                
                <form onSubmit={handleFeedbackSubmit} style={{ border: 'none', background: 'transparent', padding: 0, maxWidth: '100%' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label htmlFor="feed-target-type">Feedback Target</label>
                      <select 
                        id="feed-target-type"
                        value={targetType}
                        onChange={e => setTargetType(e.target.value as any)}
                        style={{ marginTop: '0.5rem' }}
                      >
                        <option value="system">System Experience</option>
                        <option value="food">Mess Food Menu</option>
                        <option value="cart">Cart Request</option>
                      </select>
                    </div>

                    {targetType !== 'system' && (
                      <div>
                        <label htmlFor="feed-target-id">Select Item</label>
                        <select 
                          id="feed-target-id"
                          value={targetId}
                          onChange={e => setTargetId(e.target.value)}
                          style={{ marginTop: '0.5rem' }}
                        >
                          {targetType === 'food' && foodItems.map(item => (
                            <option key={item.food_id} value={item.food_id}>{item.title} ({item.category})</option>
                          ))}
                          {targetType === 'cart' && userCarts.map(cart => (
                            <option key={cart.cart_id} value={cart.cart_id}>
                              Order on {cart.date} ({cart.items.map(i => i.title).join(', ').slice(0, 25)}...)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label>Rating (1 to 5 Stars)</label>
                    <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      {[1, 2, 3, 4, 5].map(num => (
                        <button 
                          type="button" 
                          key={num}
                          aria-label={`Rate ${num} out of 5 stars`}
                          onClick={() => setRating(num)}
                          style={{
                            background: rating >= num ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.05)',
                            color: '#fff',
                            width: '46px',
                            height: '46px',
                            minWidth: '46px',
                            minHeight: '46px',
                            borderRadius: '50%',
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            padding: 0,
                            boxShadow: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <label htmlFor="feed-comment">Comment / Feedback Description</label>
                  <textarea 
                    id="feed-comment" 
                    rows={4} 
                    placeholder="Share details about your rating..."
                    required
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    style={{ marginTop: '0.5rem', marginBottom: '1.5rem', resize: 'vertical' }}
                  />

                  <button type="submit" aria-label="Submit Feedback" style={{ width: '100%', minHeight: '44px' }}>
                    Submit Feedback
                  </button>
                </form>
              </motion.div>
            ) : (
              // Complaint Form Layout
              <motion.div
                key="complaint-form"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
              >
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#fff' }}>File a Complaint</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>Raise a ticket for food quality issues, service delays, or equipment concerns.</p>

                <form onSubmit={handleComplaintSubmit} style={{ border: 'none', background: 'transparent', padding: 0, maxWidth: '100%' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem', alignItems: 'start' }}>
                    <div>
                      <label htmlFor="comp-subject">Subject / Issue Summary</label>
                      <input 
                        type="text" 
                        id="comp-subject" 
                        placeholder="e.g., Dinner cold server, Food quality issue"
                        required
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        style={{ marginTop: '0.5rem' }}
                      />
                    </div>
                    <div>
                      <label htmlFor="comp-priority">Priority</label>
                      <select 
                        id="comp-priority"
                        value={priority}
                        onChange={e => setPriority(e.target.value as any)}
                        style={{ marginTop: '0.5rem' }}
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                      </select>
                    </div>
                  </div>

                  <label htmlFor="comp-desc">Full Description</label>
                  <textarea 
                    id="comp-desc" 
                    rows={5} 
                    placeholder="Describe your issue with as much detail as possible..."
                    required
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    style={{ marginTop: '0.5rem', marginBottom: '1.5rem', resize: 'vertical' }}
                  />

                  <button type="submit" aria-label="Submit Complaint Ticket" style={{ width: '100%', minHeight: '44px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
                    Submit Complaint Ticket
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </SpotlightCard>
      </ScrollReveal>
    </main>
  );
}
