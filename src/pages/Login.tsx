import { useState } from 'react';
import SpotlightCard from '../components/SpotlightCard';
import { loginUser, registerUser, type User } from '../utils/db';
import { AnimatePresence, motion } from 'motion/react';

interface LoginProps {
  onLogin: (user: User) => void;
  showToast: (msg: string, type?: 'success' | 'danger' | 'warning') => void;
}

export default function Login({ onLogin, showToast }: LoginProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'resident' | 'manager'>('resident');
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  const handleGuestLogin = async (targetRole: 'resident' | 'manager') => {
    setIsGuestLoading(true);
    try {
      const guestEmail = targetRole === 'manager' ? 'vikas@gmail.com' : 'student@hostel.com';
      const guestPassword = targetRole === 'manager' ? 'admin123' : 'student123';
      
      const authData = await loginUser(guestEmail, guestPassword);
      onLogin(authData.user);
      showToast(`Welcome! Logged in as Guest (${authData.user.name})`, 'success');
    } catch {
      // Direct instant fallback guest session if server is offline
      const fallbackUser: User = {
        user_id: targetRole === 'manager' ? 'u-1' : 'u-2',
        name: targetRole === 'manager' ? 'Guest Manager' : 'Guest Resident',
        email: targetRole === 'manager' ? 'vikas@gmail.com' : 'student@hostel.com',
        role: targetRole
      };
      onLogin(fallbackUser);
      showToast(`Logged in as Guest ${targetRole === 'manager' ? 'Manager' : 'Resident'}!`, 'success');
    } finally {
      setIsGuestLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      showToast("Please fill in all required fields.", "danger");
      return;
    }

    try {
      if (mode === 'login') {
        const authData = await loginUser(email.trim(), password);
        onLogin(authData.user);
        showToast(`Welcome back, ${authData.user.name}!`, "success");
      } else {
        if (!name.trim()) {
          showToast("Please enter your name.", "danger");
          return;
        }

        const authData = await registerUser({
          name: name.trim(),
          email: email.trim(),
          role: role,
          password: password
        });

        onLogin(authData.user);
        showToast(`Account registered successfully as ${role === 'manager' ? 'Manager' : 'Resident'}!`, "success");
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Operation failed. Server error.";
      console.error(err);
      showToast(errorMsg, "danger");
    }
  };

  return (
    <main className="container">
      <div style={{ maxWidth: '480px', margin: '2rem auto' }}>
        <SpotlightCard style={{ padding: '2rem' }} glowColor="rgba(255, 75, 43, 0.1)">
          <div style={{ display: 'flex', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', position: 'relative' }}>
            <button 
              className={`tab-btn ${mode === 'login' ? 'active' : ''}`} 
              onClick={() => setMode('login')}
              aria-label="Switch to Login form"
              style={{
                flex: 1, background: 'none', border: 'none', color: mode === 'login' ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: 600, padding: '0.75rem', minHeight: '44px', cursor: 'pointer', position: 'relative', outline: 'none'
              }}
            >
              <span style={{ position: 'relative', zIndex: 1 }}>Login</span>
              {mode === 'login' && (
                <motion.div
                  layoutId="loginTabUnderline"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: 'var(--gradient-primary)'
                  }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                />
              )}
            </button>
            <button 
              className={`tab-btn ${mode === 'register' ? 'active' : ''}`} 
              onClick={() => setMode('register')}
              aria-label="Switch to Register form"
              style={{
                flex: 1, background: 'none', border: 'none', color: mode === 'register' ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: 600, padding: '0.75rem', minHeight: '44px', cursor: 'pointer', position: 'relative', outline: 'none'
              }}
            >
              <span style={{ position: 'relative', zIndex: 1 }}>Register</span>
              {mode === 'register' && (
                <motion.div
                  layoutId="loginTabUnderline"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: 'var(--gradient-primary)'
                  }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                />
              )}
            </button>
          </div>
          
          <h2 style={{ fontSize: '1.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>
            {mode === 'login' ? 'Access Your Account' : 'Create Manager Account'}
          </h2>
          
          <form onSubmit={handleSubmit} style={{ maxWidth: '100%', border: 'none', padding: 0, background: 'transparent' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: mode === 'login' ? -15 : 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === 'login' ? 15 : -15 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                <div>
                  <label htmlFor="auth-email">Email Address</label>
                  <input 
                    type="email" 
                    id="auth-email" 
                    placeholder="manager@hostel.com or student@hostel.com" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ marginTop: '0.5rem', marginBottom: '1rem' }}
                  />
                </div>
                
                {mode === 'register' && (
                  <>
                    <div>
                      <label htmlFor="auth-name">Full Name / Mess Name</label>
                      <input 
                        type="text" 
                        id="auth-name" 
                        placeholder="Greenwood Residency Mess" 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{ marginTop: '0.5rem', marginBottom: '1rem' }}
                      />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label>Select Role</label>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', textTransform: 'none', fontWeight: 500, color: '#fff', minHeight: '44px', padding: '0.25rem 0.5rem' }}>
                          <input 
                            type="radio" 
                            name="auth-role" 
                            checked={role === 'resident'} 
                            onChange={() => setRole('resident')} 
                            style={{ accentColor: 'var(--primary)', width: '20px', height: '20px' }}
                          />
                          Resident / Student
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', textTransform: 'none', fontWeight: 500, color: '#fff', minHeight: '44px', padding: '0.25rem 0.5rem' }}>
                          <input 
                            type="radio" 
                            name="auth-role" 
                            checked={role === 'manager'} 
                            onChange={() => setRole('manager')}
                            style={{ accentColor: 'var(--primary)', width: '20px', height: '20px' }}
                          />
                          Mess Manager
                        </label>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="auth-password">Password</label>
                  <input 
                    type="password" 
                    id="auth-password" 
                    placeholder="••••••••" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}
                  />
                </div>

                <button 
                  type="submit" 
                  aria-label={mode === 'login' ? 'Login to your account' : 'Register new account'} 
                  style={{ width: '100%', minHeight: '44px', fontWeight: 600 }}
                >
                  {mode === 'login' ? 'Login' : 'Register Account'}
                </button>
              </motion.div>
            </AnimatePresence>
          </form>

          {/* Instant 1-Click Guest Login Section */}
          <div style={{ marginTop: '1.75rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', position: 'relative' }}>
              <span style={{ 
                fontSize: '0.75rem', 
                textTransform: 'uppercase', 
                letterSpacing: '0.08em', 
                color: 'var(--text-secondary)',
                fontWeight: 600 
              }}>
                Or 1-Click Instant Access
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => handleGuestLogin('resident')}
                disabled={isGuestLoading}
                aria-label="Login as Guest Resident immediately"
                style={{
                  width: '100%',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: isGuestLoading ? 'wait' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
                }}
              >
                <span>⚡</span>
                <span>{isGuestLoading ? 'Signing In...' : 'Login as Guest (Resident)'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleGuestLogin('manager')}
                disabled={isGuestLoading}
                aria-label="Login as Guest Manager immediately"
                style={{
                  width: '100%',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: 'rgba(255, 75, 43, 0.12)',
                  border: '1px solid rgba(255, 75, 43, 0.3)',
                  borderRadius: '10px',
                  color: '#ff7b54',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: isGuestLoading ? 'wait' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 75, 43, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(255, 75, 43, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 75, 43, 0.12)';
                  e.currentTarget.style.borderColor = 'rgba(255, 75, 43, 0.3)';
                }}
              >
                <span>👨‍💼</span>
                <span>{isGuestLoading ? 'Signing In...' : 'Login as Guest (Manager)'}</span>
              </button>
            </div>
          </div>
        </SpotlightCard>
      </div>
    </main>
  );
}
