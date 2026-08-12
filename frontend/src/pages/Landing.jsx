import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { analyticsAPI } from '../api/client'
import { motion } from 'framer-motion'
import {
  Wifi, Zap, Home, Bus, Beaker, BookOpen, Droplets, AlertCircle,
  ArrowRight, Shield, Brain, TrendingUp, CheckCircle, Clock,
  Users, Star, ChevronRight, Activity, MessageSquare
} from 'lucide-react'

const CATEGORIES = [
  { icon: Wifi, label: 'Wi-Fi', color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe' },
  { icon: Zap, label: 'Electrical', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  { icon: Home, label: 'Hostel', color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4' },
  { icon: Bus, label: 'Transport', color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  { icon: Beaker, label: 'Laboratory', color: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff' },
  { icon: BookOpen, label: 'Classroom', color: '#be185d', bg: '#fdf2f8', border: '#fbcfe8' },
  { icon: Droplets, label: 'Washroom', color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
  { icon: AlertCircle, label: 'Other', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
]

const FEATURES = [
  { icon: Brain, title: 'AI-Powered Classification', desc: 'Real sentence-transformer embeddings auto-categorize every complaint with visible confidence scores.', color: '#4f46e5', bg: '#eef2ff' },
  { icon: Shield, title: 'Smart Duplicate Detection', desc: 'Cosine similarity catches duplicates before submission — the standout demo moment.', color: '#0f766e', bg: '#f0fdfa' },
  { icon: TrendingUp, title: 'Real-Time Analytics', desc: 'Auto-generated insights surface recurring problems and campus hotspots instantly.', color: '#b45309', bg: '#fffbeb' },
  { icon: CheckCircle, title: 'End-to-End Tracking', desc: 'Every complaint gets a unique ID and a visual status stepper until resolved.', color: '#7c3aed', bg: '#faf5ff' },
]

const STEPS = [
  { step: '01', title: 'Describe the Issue', desc: 'Type your complaint — AI detects category in real time.' },
  { step: '02', title: 'AI Analyses Instantly', desc: 'Category, priority and department assigned automatically.' },
  { step: '03', title: 'Duplicate Check', desc: 'System flags if others already reported the same issue.' },
  { step: '04', title: 'Track & Resolve', desc: 'Get a unique ID and live status updates till resolved.' },
]

function StatCard({ label, value, color, icon: Icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
      style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, minWidth: 160 }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1 }}>{value ?? '—'}</div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3, fontWeight: 500 }}>{label}</div>
      </div>
    </motion.div>
  )
}

export default function Landing() {
  const [stats, setStats] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    analyticsAPI.overview().then(r => setStats(r.data)).catch(() => {})
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>

      {/* Navbar */}
      <nav className="navbar" style={{ padding: '0 40px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg, #4f46e5, #0ea5e9)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain size={20} color="white" />
          </div>
          <div>
            <span style={{ fontWeight: 900, fontSize: 17, color: '#0f172a' }}>SCMS</span>
            <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6, fontWeight: 500 }}>Smart Complaint System</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link to="/track" className="btn-ghost" style={{ textDecoration: 'none', fontSize: 14 }}>
            <Clock size={15} /> Track Complaint
          </Link>
          <Link to="/admin/login" className="btn-ghost" style={{ textDecoration: 'none', fontSize: 14 }}>
            Admin
          </Link>
          <Link to="/submit" className="btn-primary" style={{ textDecoration: 'none', padding: '9px 20px' }}>
            Report Issue <ArrowRight size={15} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="hero-gradient" style={{ padding: '80px 40px 60px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div className="hero-blob" style={{ width: 500, height: 500, background: 'rgba(79,70,229,0.12)', top: -200, left: -100 }} />
        <div className="hero-blob" style={{ width: 400, height: 400, background: 'rgba(14,165,233,0.1)', top: -100, right: -80 }} />

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ position: 'relative', maxWidth: 1000, margin: '0 auto' }}>
          
          <h1 style={{ fontSize: 'clamp(36px, 5.5vw, 56px)', fontWeight: 900, lineHeight: 1.1, margin: '0 0 16px', color: '#0f172a' }}>
            Smart Complaint Management System
          </h1>

          <p style={{ fontSize: 18, color: '#64748b', maxWidth: 560, margin: '0 auto 48px', lineHeight: 1.7, fontWeight: 500 }}>
            Report it. Track it. Get it resolved.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, padding: '0 20px', marginBottom: 20 }}>
            
            {/* Student Login Card */}
            <div className="card" style={{ padding: 40, textAlign: 'center', background: 'white', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Users size={32} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Student Login</h2>
              <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.6, marginBottom: 32, flexGrow: 1 }}>
                Report & track your campus complaints. Upload photos and get real-time AI updates.
              </p>
              <button onClick={() => navigate('/login/student')} className="btn-primary" style={{ padding: '14px 0', fontSize: 16, borderRadius: 12, width: '100%', background: '#4f46e5' }}>
                Login as Student
              </button>
              <div style={{ marginTop: 16 }}>
                <Link to="/submit" style={{ fontSize: 14, color: '#64748b', textDecoration: 'underline' }}>
                  Continue as Guest / Anonymous
                </Link>
              </div>
            </div>

            {/* Admin Login Card */}
            <div className="card" style={{ padding: 40, textAlign: 'center', background: 'white', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: '#f8fafc', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Shield size={32} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Admin Login</h2>
              <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.6, marginBottom: 32, flexGrow: 1 }}>
                Manage & resolve department complaints. View AI analytics and campus hotspots.
              </p>
              <button onClick={() => navigate('/admin/login')} className="btn-primary" style={{ padding: '14px 0', fontSize: 16, borderRadius: 12, width: '100%', background: '#334155' }}>
                Login as Admin
              </button>
            </div>

          </div>
        </motion.div>

        {/* Live stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginTop: 32, position: 'relative' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.8)', padding: '12px 24px', borderRadius: 30, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(0,0,0,0.05)' }}>
             <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
             <span style={{ fontSize: 15, fontWeight: 600, color: '#334155' }}>
               <strong style={{ color: '#10b981' }}>{stats.resolved ?? 0}</strong> complaints resolved this month
             </span>
          </div>
        </motion.div>
      </div>

      {/* Category chips */}
      <div style={{ padding: '52px 40px 0', textAlign: 'center' }}>
        <div className="section-label" style={{ marginBottom: 20 }}>Report issues across all campus facilities</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 860, margin: '0 auto' }}>
          {CATEGORIES.map(({ icon: Icon, label, color, bg, border }) => (
            <motion.div
              key={label}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="category-pill"
              onClick={() => navigate('/submit')}
              style={{ color, background: bg, borderColor: border }}
            >
              <Icon size={15} /> {label}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={{ padding: '64px 40px 0', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="section-label">Why SCMS?</div>
          <h2 style={{ fontSize: 34, fontWeight: 800, color: '#0f172a' }}>
            Not just a complaint box —{' '}
            <span className="gradient-text-warm">a decision-making tool</span>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {FEATURES.map(({ icon: Icon, title, desc, color, bg }, i) => (
            <motion.div
              key={title}
              className="card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              style={{ padding: 28 }}
            >
              <div style={{ width: 48, height: 48, background: bg, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <Icon size={24} color={color} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#0f172a' }}>{title}</h3>
              <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.65 }}>{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div style={{ padding: '64px 40px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="section-label">Process</div>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#0f172a' }}>How It Works</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32 }}>
          {STEPS.map(({ step, title, desc }, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #4f46e5, #0ea5e9)', color: 'white', fontWeight: 900, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(79,70,229,0.25)' }}>
                {i + 1}
              </div>
              <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: '#0f172a' }}>{title}</h3>
              <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.65 }}>{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '0 40px 80px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card"
          style={{
            maxWidth: 700, margin: '0 auto', padding: '52px 40px', textAlign: 'center',
            background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
            border: 'none', boxShadow: '0 20px 60px rgba(79,70,229,0.3)'
          }}
        >
          <Users size={40} color="rgba(255,255,255,0.9)" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 12, color: 'white' }}>Ready to report an issue?</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 32, fontSize: 16 }}>Takes under 30 seconds. AI does the analysis.</p>
          <button onClick={() => navigate('/submit')} style={{
            background: 'white', color: '#4f46e5', border: 'none', padding: '14px 36px',
            borderRadius: 12, fontWeight: 700, fontSize: 16, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            Submit a Complaint <ArrowRight size={18} />
          </button>
        </motion.div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '20px 40px', borderTop: '1px solid #e2e8f0', color: '#94a3b8', fontSize: 13 }}>
        SCMS — Built for HACKMATRIX 1.0 | AI & Data Science Department
      </div>
    </div>
  )
}
