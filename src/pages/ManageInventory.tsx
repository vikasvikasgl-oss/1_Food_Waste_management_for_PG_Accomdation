import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import SpotlightCard from '../components/SpotlightCard';
import ScrollReveal from '../components/ScrollReveal';
import { getFoodItems, saveFoodItem, updateFoodItem, deleteFoodItem, type FoodItem } from '../utils/db';

interface ManageInventoryProps {
  showToast: (msg: string, type?: 'success' | 'danger' | 'warning') => void;
}

export default function ManageInventory({ showToast }: ManageInventoryProps) {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Main Course');
  const [quantity, setQuantity] = useState('');
  const [status, setStatus] = useState<'available' | 'low_stock' | 'out_of_stock'>('available');

  const loadItems = () => {
    setLoading(true);
    setError(null);
    getFoodItems()
      .then(data => {
        setItems(data);
        setLoading(false);
      })
      .catch(err => {
        const msg = err instanceof Error ? err.message : "Failed to load inventory.";
        console.error("Failed to load inventory", err);
        setError(msg);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = parseFloat(quantity);
    if (!title.trim() || isNaN(qtyNum)) {
      showToast("Please fill in the food item form correctly.", "danger");
      return;
    }

    try {
      if (editingItem) {
        await updateFoodItem({
          food_id: editingItem.food_id,
          title: title.trim(),
          category,
          quantity_available: qtyNum,
          status
        });
        showToast(`Food item '${title}' updated successfully!`, "success");
        setEditingItem(null);
      } else {
        await saveFoodItem({
          title: title.trim(),
          category,
          quantity_available: qtyNum,
          status
        });
        showToast(`Food item '${title}' added to database!`, "success");
      }

      // Reset Form
      setTitle('');
      setQuantity('');
      setStatus('available');
      setCategory('Main Course');
      loadItems();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to save food item.";
      console.error(err);
      showToast(errorMsg, "danger");
    }
  };

  const handleEdit = (item: FoodItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setCategory(item.category);
    setQuantity(item.quantity_available.toString());
    setStatus(item.status);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete '${name}' from inventory?`)) {
      try {
        await deleteFoodItem(id);
        showToast(`Deleted '${name}' successfully.`, "warning");
        loadItems();
        if (editingItem?.food_id === id) {
          setEditingItem(null);
          setTitle('');
          setQuantity('');
          setStatus('available');
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Failed to delete food item.";
        console.error(err);
        showToast(errorMsg, "danger");
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setTitle('');
    setQuantity('');
    setStatus('available');
    setCategory('Main Course');
  };

  return (
    <main className="container" style={{ maxWidth: '1200px' }}>
      <ScrollReveal delay={0.05}>
        <section style={{ marginBottom: '2rem' }}>
          <h2>Manage Mess Food Inventory</h2>
          <p>Create, update, or remove active food items from the kitchen inventory and track their status.</p>
        </section>
      </ScrollReveal>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        {/* Form Column */}
        <ScrollReveal delay={0.1}>
          <SpotlightCard style={{ padding: '2rem' }} glowColor="rgba(46, 213, 115, 0.15)">
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1.25rem', color: '#fff' }}>
              {editingItem ? '✏️ Edit Food Item' : '➕ Add New Food Item'}
            </h3>

            <form onSubmit={handleSubmit} style={{ border: 'none', background: 'transparent', padding: 0, maxWidth: '100%' }}>
              <label htmlFor="inv-title">Food Title</label>
              <input 
                type="text" 
                id="inv-title" 
                placeholder="e.g., Paneer Tikka Masala"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{ marginTop: '0.5rem', marginBottom: '1rem' }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label htmlFor="inv-category">Category</label>
                  <select 
                    id="inv-category"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    style={{ marginTop: '0.5rem' }}
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Main Course">Main Course</option>
                    <option value="Side Dish">Side Dish</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Dessert">Dessert</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="inv-quantity">Qty Available (kg)</label>
                  <input 
                    type="number" 
                    id="inv-quantity" 
                    min="0" 
                    step="0.1" 
                    placeholder="e.g., 40.5"
                    required
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    style={{ marginTop: '0.5rem' }}
                  />
                </div>
              </div>

              <label htmlFor="inv-status">Availability Status</label>
              <select 
                id="inv-status"
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}
              >
                <option value="available">Available</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" style={{ flex: 1 }}>
                  {editingItem ? 'Save Updates' : 'Add Item'}
                </button>
                {editingItem && (
                  <button type="button" className="secondary" onClick={handleCancelEdit} style={{ flex: 1 }}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </SpotlightCard>
        </ScrollReveal>

        {/* List Column */}
        <ScrollReveal delay={0.15}>
          <section style={{ borderTop: 'none', background: 'none', boxShadow: 'none', padding: 0 }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#fff' }}>📋 Kitchen Stock List</h3>
            
            {/* Desktop Table View */}
            <div className="table-wrapper hidden md:block" style={{ marginTop: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Food Item</th>
                    <th>Category</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {loading ? (
                      <motion.tr key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', animation: 'spin 1.5s linear infinite' }}>⏳</div>
                          Loading stock inventory...
                        </td>
                      </motion.tr>
                    ) : error ? (
                      <motion.tr key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--danger)' }}>
                          <p style={{ marginBottom: '1rem' }}>⚠️ {error}</p>
                          <button onClick={loadItems} style={{ padding: '0.4rem 1rem' }}>Retry</button>
                        </td>
                      </motion.tr>
                    ) : items.length === 0 ? (
                      <motion.tr
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                          No items in stock. Add some using the form.
                        </td>
                      </motion.tr>
                    ) : (
                      items.map(item => {
                        let statusBadge = null;
                        if (item.status === 'available') {
                          statusBadge = <span className="badge badge-success">Available</span>;
                        } else if (item.status === 'low_stock') {
                          statusBadge = <span className="badge badge-warning">Low Stock</span>;
                        } else {
                          statusBadge = <span className="badge badge-danger">Out of Stock</span>;
                        }

                        return (
                          <motion.tr 
                            key={item.food_id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          >
                            <td><b>{item.title}</b></td>
                            <td>{item.category}</td>
                            <td>{item.quantity_available} kg</td>
                            <td>{statusBadge}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button 
                                  className="btn-delete" 
                                  aria-label={`Edit ${item.title}`}
                                  style={{ color: 'var(--secondary)', borderColor: 'rgba(255, 144, 0, 0.2)', minHeight: '44px', padding: '0.4rem 0.9rem' }}
                                  onClick={() => handleEdit(item)}
                                >
                                  Edit
                                </button>
                                <button 
                                  className="btn-delete" 
                                  aria-label={`Delete ${item.title}`}
                                  style={{ minHeight: '44px', padding: '0.4rem 0.9rem' }}
                                  onClick={() => handleDelete(item.food_id, item.title)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Mobile Card Stack View (< 768px) */}
            <div className="block md:hidden space-y-3">
              <AnimatePresence initial={false}>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', animation: 'spin 1.5s linear infinite' }}>⏳</div>
                    Loading stock inventory...
                  </div>
                ) : error ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--danger)' }}>
                    <p style={{ marginBottom: '1rem' }}>⚠️ {error}</p>
                    <button onClick={loadItems} style={{ padding: '0.4rem 1rem', minHeight: '44px' }}>Retry</button>
                  </div>
                ) : items.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', background: 'var(--gradient-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    No items in stock. Add some using the form.
                  </div>
                ) : (
                  items.map(item => {
                    let statusBadge = null;
                    if (item.status === 'available') {
                      statusBadge = <span className="badge badge-success">Available</span>;
                    } else if (item.status === 'low_stock') {
                      statusBadge = <span className="badge badge-warning">Low Stock</span>;
                    } else {
                      statusBadge = <span className="badge badge-danger">Out of Stock</span>;
                    }

                    return (
                      <SpotlightCard key={item.food_id} glowColor="rgba(46, 213, 115, 0.1)" style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.category}</span>
                            <h4 style={{ margin: '0.15rem 0', fontSize: '1.15rem', color: '#fff' }}>{item.title}</h4>
                          </div>
                          <div>{statusBadge}</div>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Stock Available:</span>
                          <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>{item.quantity_available} kg</strong>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                          <button 
                            className="secondary"
                            aria-label={`Edit ${item.title}`}
                            style={{ minHeight: '44px', width: '100%', fontSize: '0.85rem' }}
                            onClick={() => handleEdit(item)}
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            className="btn-delete" 
                            aria-label={`Delete ${item.title}`}
                            style={{ minHeight: '44px', width: '100%', fontSize: '0.85rem' }}
                            onClick={() => handleDelete(item.food_id, item.title)}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </SpotlightCard>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </section>
        </ScrollReveal>
      </div>
    </main>
  );
}
