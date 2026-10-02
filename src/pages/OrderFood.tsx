import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import SpotlightCard from '../components/SpotlightCard';
import ScrollReveal from '../components/ScrollReveal';
import MealAttendanceCalendar from '../components/MealAttendanceCalendar';
import { getFoodItems, createCartRequest, type FoodItem, type User } from '../utils/db';

const gridContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04
    }
  }
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: 'spring', 
      stiffness: 260, 
      damping: 20 
    } 
  }
} as const;

interface OrderFoodProps {
  user: User;
  showToast: (msg: string, type?: 'success' | 'danger' | 'warning') => void;
}

interface CartState {
  [foodId: string]: number;
}

export default function OrderFood({ user, showToast }: OrderFoodProps) {
  const [activeResidentView, setActiveResidentView] = useState<'menu' | 'attendance'>('menu');
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [cart, setCart] = useState<CartState>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItems = () => {
    setLoading(true);
    setError(null);
    getFoodItems()
      .then(data => {
        setFoodItems(data);
        setLoading(false);
      })
      .catch(err => {
        const msg = err instanceof Error ? err.message : "Failed to load food items.";
        console.error("Failed to load food items", err);
        setError(msg);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleAddToCart = (foodId: string) => {
    const item = foodItems.find(i => i.food_id === foodId);
    if (!item) return;

    if (item.status === 'out_of_stock' || item.quantity_available <= 0) {
      showToast(`${item.title} is currently out of stock.`, 'danger');
      return;
    }

    setCart(prev => {
      const currentQty = prev[foodId] || 0;
      if (currentQty >= item.quantity_available) {
        showToast(`Cannot add more. Only ${item.quantity_available} kg available.`, 'warning');
        return prev;
      }
      return {
        ...prev,
        [foodId]: currentQty + 1
      };
    });
  };

  const handleUpdateQty = (foodId: string, delta: number) => {
    const item = foodItems.find(i => i.food_id === foodId);
    if (!item) return;

    setCart(prev => {
      const currentQty = prev[foodId] || 0;
      const newQty = currentQty + delta;
      
      if (newQty <= 0) {
        const next = { ...prev };
        delete next[foodId];
        return next;
      }

      if (newQty > item.quantity_available) {
        showToast(`Only ${item.quantity_available} kg available.`, 'warning');
        return prev;
      }

      return {
        ...prev,
        [foodId]: newQty
      };
    });
  };

  const handlePlaceOrder = async () => {
    const cartEntries = Object.entries(cart);
    if (cartEntries.length === 0) {
      showToast('Your cart is empty.', 'danger');
      return;
    }

    const itemsToSubmit = cartEntries.map(([foodId, qty]) => {
      const item = foodItems.find(i => i.food_id === foodId)!;
      return {
        food_id: foodId,
        title: item.title,
        category: item.category,
        quantity: qty
      };
    });

    try {
      await createCartRequest(user.user_id, user.name, itemsToSubmit);
      showToast('Your food request has been submitted successfully!', 'success');
      setCart({});
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to place food request.';
      console.error(err);
      showToast(errorMsg, 'danger');
    }
  };

  // Filter items
  const filteredItems = foodItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...Array.from(new Set(foodItems.map(i => i.category)))];

  const cartItemsCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  return (
    <main className="container" style={{ maxWidth: '1300px' }}>
      <ScrollReveal delay={0.05}>
        <section style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2>Resident Mess Portal</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              Order fresh daily meals, check stock, or mark <strong>upcoming meal skips</strong> to help our hostel eliminate food waste.
            </p>
          </div>

          {/* Sub-view switcher tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.04)', padding: '0.35rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setActiveResidentView('menu')}
              style={{
                padding: '0.45rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                background: activeResidentView === 'menu' ? 'var(--primary)' : 'transparent',
                color: activeResidentView === 'menu' ? '#000' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer'
              }}
            >
              🍽️ Food Menu & Order
            </button>
            <button
              onClick={() => setActiveResidentView('attendance')}
              style={{
                padding: '0.45rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                background: activeResidentView === 'attendance' ? 'var(--primary)' : 'transparent',
                color: activeResidentView === 'attendance' ? '#000' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer'
              }}
            >
              📅 Weekly Skip Calendar
            </button>
          </div>
        </section>
      </ScrollReveal>

      {activeResidentView === 'attendance' ? (
        <MealAttendanceCalendar user={user} showToast={showToast} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>
        {/* Left Side: Food Grid */}
        <div>
          {/* Search & Filters */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="Search food item..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              style={{ flex: 1, minWidth: '200px' }}
            />
            <select 
              value={categoryFilter} 
              onChange={e => setCategoryFilter(e.target.value)}
              style={{ width: '200px' }}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--gradient-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'spin 1.5s linear infinite' }}>⏳</div>
              <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Loading Fresh Menu...</h3>
              <p style={{ color: 'var(--text-muted)' }}>Fetching available mess items.</p>
            </div>
          ) : error ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-md)', color: '#fff' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚠️</div>
              <h3 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>Failed to Load Menu</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
              <button onClick={loadItems} style={{ padding: '0.6rem 1.5rem' }}>Retry</button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--gradient-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
              No food items match your search or filter.
            </div>
          ) : (
            <motion.div 
              key={`${categoryFilter}-${searchTerm}`}
              variants={gridContainerVariants}
              initial="hidden"
              animate="show"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}
            >
              {filteredItems.map(item => {
                const cartQty = cart[item.food_id] || 0;
                let statusColor = 'var(--success)';
                if (item.status === 'out_of_stock') statusColor = 'var(--danger)';
                else if (item.status === 'low_stock') statusColor = 'var(--warning)';

                return (
                  <motion.div key={item.food_id} variants={cardItemVariants} layout>
                    <SpotlightCard glowColor="rgba(46, 213, 115, 0.15)" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                        <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)' }}>{item.category}</span>
                        <span style={{ fontSize: '0.8rem', color: statusColor, fontWeight: 600, textTransform: 'uppercase' }}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 700 }}>{item.title}</h3>
                      
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0 0 1.5rem 0' }}>
                        Available Stock: <strong>{item.quantity_available} kg</strong>
                      </p>

                      <div style={{ marginTop: 'auto' }}>
                        {cartQty > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.05)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                            <button onClick={() => handleUpdateQty(item.food_id, -1)} style={{ background: 'none', border: 'none', padding: '0.2rem 0.5rem', color: '#fff', fontSize: '1.1rem' }}>-</button>
                            <span style={{ fontWeight: 600 }}>{cartQty} kg</span>
                            <button onClick={() => handleUpdateQty(item.food_id, 1)} style={{ background: 'none', border: 'none', padding: '0.2rem 0.5rem', color: '#fff', fontSize: '1.1rem' }}>+</button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleAddToCart(item.food_id)}
                            disabled={item.status === 'out_of_stock' || item.quantity_available <= 0}
                            style={{ width: '100%', opacity: (item.status === 'out_of_stock' || item.quantity_available <= 0) ? 0.5 : 1 }}
                          >
                            {(item.status === 'out_of_stock' || item.quantity_available <= 0) ? 'Out of Stock' : 'Add to Request'}
                          </button>
                        )}
                      </div>
                    </SpotlightCard>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* Right Side: Cart Summary */}
        <div style={{ position: 'sticky', top: '100px' }}>
          <SpotlightCard style={{ padding: '1.5rem' }} glowColor="rgba(46, 213, 115, 0.15)">
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', color: '#fff' }}>
              <span>🛒 Cart</span>
              <motion.span 
                key={cartItemsCount}
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{ scale: [1, 1.25, 1], opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="badge" 
                style={{ background: 'var(--gradient-primary)', color: '#fff' }}
              >
                {cartItemsCount} items
              </motion.span>
            </h3>

            {cartItemsCount === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', textAlign: 'center', padding: '2rem 0', margin: 0 }}>
                No items added to your cart request.
              </p>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                  <AnimatePresence initial={false}>
                    {Object.entries(cart).map(([foodId, qty]) => {
                      const item = foodItems.find(i => i.food_id === foodId)!;
                      return (
                        <motion.div 
                          key={foodId}
                          layout
                          initial={{ opacity: 0, height: 0, y: -10 }}
                          animate={{ opacity: 1, height: 'auto', y: 0 }}
                          exit={{ opacity: 0, height: 0, y: 10 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.03)', paddingBottom: '0.5rem', overflow: 'hidden' }}
                        >
                          <div>
                            <span style={{ fontWeight: 500, display: 'block', fontSize: '0.95rem' }}>{item.title}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.category}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button onClick={() => handleUpdateQty(foodId, -1)} style={{ padding: '0.1rem 0.4rem', fontSize: '0.8rem', background: 'rgba(255, 255, 255, 0.05)', color: '#fff' }}>-</button>
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, minWidth: '2.5rem', textAlign: 'center' }}>{qty} kg</span>
                            <button onClick={() => handleUpdateQty(foodId, 1)} style={{ padding: '0.1rem 0.4rem', fontSize: '0.8rem', background: 'rgba(255, 255, 255, 0.05)', color: '#fff' }}>+</button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                <button 
                  onClick={handlePlaceOrder}
                  style={{ width: '100%', background: 'var(--gradient-primary)' }}
                >
                  Place Food Request
                </button>
              </>
            )}
          </SpotlightCard>
        </div>
      </div>
      )}
    </main>
  );
}
