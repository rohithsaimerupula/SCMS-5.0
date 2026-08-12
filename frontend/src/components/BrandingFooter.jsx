import { useLocation } from 'react-router-dom'

const BADGES = [
  'NAAC A+', 'NIRF', 'UGC Autonomous', 'IEEE CIS SBC', 'IIC', 'MATRIX Club'
]

export default function BrandingFooter() {
  const location = useLocation()
  
  // Don't show footer on Splash screen since it has the large top band
  if (location.pathname === '/') return null

  return (
    <footer style={{
      background: '#f8fafc',
      borderTop: '1px solid #e2e8f0',
      padding: '12px 24px',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '16px',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      color: '#64748b'
    }}>
      <div style={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
        <img 
          src="https://upload.wikimedia.org/wikipedia/en/thumb/e/e4/Vignan_logo.png/220px-Vignan_logo.png" 
          alt="Vignan" 
          style={{ height: 20, objectFit: 'contain' }}
          onError={(e) => { e.target.style.display = 'none' }}
        />
        <span>VIIT (A) | HACKMATRIX 1.0</span>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {BADGES.map(badge => (
          <span 
            key={badge}
            style={{
              padding: '2px 8px',
              background: '#f1f5f9',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              fontWeight: 600,
              color: '#475569'
            }}
          >
            {badge}
          </span>
        ))}
      </div>
    </footer>
  )
}
