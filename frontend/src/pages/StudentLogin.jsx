import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Brain, Lock, Eye, EyeOff, Loader2, Zap, Users } from 'lucide-react'

const QUICK_USERS = [
  { label: '🎓 Student Demo', email: 'student@vignan.ac.in', password: 'demo1234' },
]

export default function StudentLogin() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    if (result.success) {
      if (result.user.role !== 'student') { toast.error('This portal is for students only.'); return }
      toast.success(`Welcome, ${result.user.name}!`)
      navigate('/student/dashboard')
    } else {
      toast.error(result.error)
    }
  }

  const quickLogin = async (e, p) => {
    setLoading(true)
    const result = await login(e, p)
    setLoading(false)
    if (result.success) { toast.success(`Welcome, ${result.user.name}!`); navigate('/track') }
    else toast.error(result.error)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #f0f4ff 0%, #faf5ff 50%, #f0f9ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ position: 'fixed', inset: 0 }}>
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'rgba(79,70,229,0.1)', filter: 'blur(80px)', top: -100, left: -100 }} />
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(14,165,233,0.08)', filter: 'blur(60px)', bottom: 0, right: 0 }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ maxWidth: 440, width: '100%', position: 'relative' }}
      >
        {/* Header card */}
        <div className="card" style={{ padding: 40 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg, #4f46e5, #0ea5e9)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(79,70,229,0.3)' }}>
              <Users size={32} color="white" />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Student Login</h1>
            <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>Smart Complaint Management System</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label className="form-label">Email Address</label>
              <input
                className="input-field"
                type="email"
                placeholder="student@vignan.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input-field"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, borderRadius: 11 }}>
              {loading ? <Loader2 size={17} className="spin" /> : <><Lock size={15} /> Sign In</>}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
            <div className="divider" style={{ flex: 1 }} />
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap' }}>Quick Access (Demo)</span>
            <div className="divider" style={{ flex: 1 }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {QUICK_USERS.map(({ label, email: e, password: p }) => (
              <button
                key={e}
                type="button"
                disabled={loading}
                onClick={() => quickLogin(e, p)}
                style={{
                  padding: '10px 14px', background: '#f8fafc', border: '1.5px solid #e2e8f0',
                  borderRadius: 9, cursor: 'pointer', color: '#374151', fontSize: 13, fontWeight: 600,
                  textAlign: 'left', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 8
                }}
                onMouseEnter={(el) => { el.currentTarget.style.borderColor = '#c7d2fe'; el.currentTarget.style.background = '#eef2ff'; el.currentTarget.style.color = '#4338ca' }}
                onMouseLeave={(el) => { el.currentTarget.style.borderColor = '#e2e8f0'; el.currentTarget.style.background = '#f8fafc'; el.currentTarget.style.color = '#374151' }}
              >
                <Zap size={14} color="#4f46e5" />
                {label}
                <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: 11 }}>{e}</span>
              </button>
            ))}
          </div>

          <button onClick={() => navigate('/')} className="btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 20, color: '#94a3b8' }}>
            ← Back to Home
          </button>
        </div>
      </motion.div>
    </div>
  )
}
