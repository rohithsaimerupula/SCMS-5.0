import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, ArrowRight } from 'lucide-react'

const BADGES = [
  'NAAC A+', 'NIRF', 'UGC Autonomous', 'IEEE CIS SBC', 'IIC', 'MATRIX Club'
]

export default function Splash() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0f172a' }}>
      
      {/* Top Band: Institutional Branding */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        style={{ 
          background: '#ffffff', 
          padding: '16px 24px', 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img 
            src="https://upload.wikimedia.org/wikipedia/en/thumb/e/e4/Vignan_logo.png/220px-Vignan_logo.png" 
            alt="Vignan Logo" 
            style={{ height: 40, objectFit: 'contain' }}
            onError={(e) => { e.target.style.display = 'none' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 900, color: '#1e293b', fontSize: '18px', letterSpacing: '-0.5px' }}>
              Vignan's Institute of Information Technology
            </span>
            <span style={{ color: '#4f46e5', fontWeight: 700, fontSize: '14px', letterSpacing: '1px' }}>
              HACKMATRIX 1.0
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {BADGES.map((badge, i) => (
            <motion.span 
              key={badge}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + (i * 0.1) }}
              style={{
                padding: '4px 10px',
                background: '#f8fafc',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                fontWeight: 700,
                color: '#334155',
                fontSize: '12px'
              }}
            >
              {badge}
            </motion.span>
          ))}
        </div>
      </motion.div>

      {/* Middle Band: Product Identity */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden' }}>
        
        {/* Decorative background elements */}
        <div style={{ position: 'absolute', top: '10%', left: '20%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(79,70,229,0.15) 0%, rgba(15,23,42,0) 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '20%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(14,165,233,0.1) 0%, rgba(15,23,42,0) 70%)', borderRadius: '50%' }} />

        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2, type: 'spring' }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', zIndex: 10, maxWidth: 600 }}
        >
          <div style={{ 
            width: 100, height: 100, 
            background: 'linear-gradient(135deg, #4f46e5, #0ea5e9)', 
            borderRadius: '24px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '24px',
            boxShadow: '0 10px 40px rgba(79,70,229,0.4)',
            transform: 'rotate(-5deg)'
          }}>
            <ShieldCheck size={56} color="white" strokeWidth={2.5} />
          </div>

          <h1 style={{ 
            fontSize: '56px', fontWeight: 900, color: 'white', margin: 0, 
            letterSpacing: '-2px',
            textShadow: '0 4px 20px rgba(0,0,0,0.5)'
          }}>
            SCMS
          </h1>
          <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#94a3b8', margin: '8px 0 24px 0' }}>
            Smart Complaint Management System
          </h2>
          <p style={{ fontSize: '18px', color: '#e2e8f0', fontWeight: 500, fontStyle: 'italic', background: 'rgba(255,255,255,0.05)', padding: '12px 24px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
            "Report it. Track it. Get it resolved."
          </p>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            onClick={() => navigate('/login')}
            style={{
              marginTop: '48px',
              padding: '16px 32px',
              background: 'white',
              color: '#0f172a',
              borderRadius: '30px',
              border: 'none',
              fontSize: '16px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 10px 30px rgba(255,255,255,0.2)'
            }}
          >
            Get Started <ArrowRight size={18} />
          </motion.button>
        </motion.div>
      </div>

    </div>
  )
}
