import DecryptedText from '../components/DecryptedText';
import SpotlightCard from '../components/SpotlightCard';
import ScrollReveal from '../components/ScrollReveal';

interface HomeProps {
  user: any;
  setTab: (tab: string) => void;
}

export default function Home({ user, setTab }: HomeProps) {
  return (
    <main className="container" style={{ maxWidth: '1300px' }}>
      {/* Split Hero Section */}
      <section 
        id="hero-banner" 
        style={{ 
          minHeight: '75vh', 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '3rem',
          alignItems: 'center',
          padding: '4rem 3rem',
          background: 'none',
          border: 'none',
          boxShadow: 'none',
          position: 'relative',
          overflow: 'visible'
        }}
      >
        {/* Glow backdrop behind the robot */}
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '5%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(255, 75, 43, 0.08) 0%, rgba(255, 65, 108, 0.02) 70%, transparent 100%)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />

        {/* Left Column (Content) */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div className="badge-pill-global">
            <span style={{ marginRight: '0.25rem' }}>🌐</span>
            <DecryptedText 
              text={user ? `SESSION ACTIVE: ${user.name.toUpperCase()}` : "GLOBAL FOOD OPTIMIZATION SYSTEM"}
              speed={40}
              maxIterations={10}
              animateOn="view"
            />
          </div>

          <h1 style={{ fontSize: '3.8rem', lineHeight: '1.15', fontWeight: 800, marginBottom: '1.5rem', letterSpacing: '-0.03em' }}>
            Technology <br />
            Crafted for <span className="text-highlight">All Food,</span> <br />
            Not <span style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Waste</span>
          </h1>

          <p id="hero-desc" style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '2.5rem', maxWidth: '520px' }}>
            We create clear, intuitive, and accessible waste management systems shaped by real human behavior and dining insights.
          </p>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {user ? (
              <button className="btn" onClick={() => setTab('upload')} style={{ padding: '0.9rem 1.8rem', borderRadius: 'var(--radius-full)', fontSize: '1rem', fontWeight: 600 }}>
                Upload Daily Logs →
              </button>
            ) : (
              <button className="btn" onClick={() => setTab('login')} style={{ padding: '0.9rem 1.8rem', borderRadius: 'var(--radius-full)', fontSize: '1rem', fontWeight: 600 }}>
                Get started now →
              </button>
            )}

            <div className="badge-clients" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '2px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff4b2b', display: 'inline-block' }} />
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff9000', display: 'inline-block' }} />
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff416c', display: 'inline-block' }} />
              </div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                <strong>800+ Messes</strong> Optimized
              </span>
            </div>
          </div>
        </div>

        {/* Right Column (Floating Robot Video & Stats) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 2 }}>
          <div className="video-card-container float-animation">
            <video
              autoPlay
              loop
              muted
              playsInline
            >
              <source src="https://res.cloudinary.com/djeoh00s4/video/upload/v1778953091/kling_20260516_Image_to_Video__4121_0_wunuoe.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div className="video-overlay-grad" />
          </div>

          {/* Stats Badges floating on bottom right */}
          <div className="hero-stats-overlay">
            <div className="hero-stat-box">
              <h4>150+</h4>
              <p>Messes Optimized</p>
            </div>
            <div className="hero-stat-box">
              <h4>98%</h4>
              <p>Wastage Reduced</p>
            </div>
          </div>
        </div>
      </section>

      {/* App Highlights Grid (Animates on Scroll) */}
      <ScrollReveal delay={0.15}>
        <div className="dashboard-grid" id="benefits-grid" style={{ marginTop: '4rem' }}>
          <SpotlightCard id="benefit-track">
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
            <h3>Daily Tracking</h3>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.5', color: 'var(--text-secondary)', margin: 0 }}>
              Log daily food preparations and track consumed quantities to monitor where wastage happens in real-time.
            </p>
          </SpotlightCard>
          
          <SpotlightCard id="benefit-predict">
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔮</div>
            <h3>Smart Forecasting</h3>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.5', color: 'var(--text-secondary)', margin: 0 }}>
              Automated forecasting algorithms project the next month's requirement based on historic trends.
            </p>
          </SpotlightCard>

          <SpotlightCard id="benefit-report">
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📈</div>
            <h3>Analytics Dashboard</h3>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.5', color: 'var(--text-secondary)', margin: 0 }}>
              Render beautiful interactive charts detailing monthly preparation vs waste trends.
            </p>
          </SpotlightCard>
        </div>
      </ScrollReveal>
    </main>
  );
}
