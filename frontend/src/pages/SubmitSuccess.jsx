import { useLocation, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, Copy, ArrowRight, Clock, Brain, Share2 } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

const PRIORITY_COLORS = { High: '#dc2626', Medium: '#d97706', Low: '#16a34a' }
const PRIORITY_BG = { High: '#fef2f2', Medium: '#fffbeb', Low: '#f0fdf4' }
const PRIORITY_BORDER = { High: '#fecaca', Medium: '#fde68a', Low: '#bbf7d0' }
const RESOLUTION = { High: '24 hours', Medium: '3–5 business days', Low: '7–10 business days' }
const PRIORITY_EMOJI = { High: '🔴', Medium: '🟡', Low: '🟢' }

export default function SubmitSuccess() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const complaint = state?.complaint
  const [copied, setCopied] = useState(false)

  if (!complaint) { navigate('/'); return null }

  const copyId = () => {
    navigator.clipboard.writeText(complaint.complaint_id)
    setCopied(true)
    toast.success('Complaint ID copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const priority = complaint.priority || 'Medium'

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {/* Soft background accent */}
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at top center, rgba(16,185,129,0.06) 0%, transparent 60%)' }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        className="card"
        style={{ maxWidth: 540, width: '100%', padding: 48, position: 'relative' }}
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 300 }}
          style={{
            width: 80, height: 80,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 12px 32px rgba(16,185,129,0.3)'
          }}
        >
          <CheckCircle size={44} color="white" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', textAlign: 'center', marginBottom: 6 }}>
            Complaint Submitted!
          </h1>
          <p style={{ color: '#64748b', textAlign: 'center', marginBottom: 32, fontSize: 14 }}>
            Your complaint has been received and AI-analysed. Save your ID to track progress.
          </p>

          {/* Complaint ID */}
          <div style={{
            background: 'linear-gradient(135deg, #eef2ff, #f0f9ff)',
            border: '1.5px solid #c7d2fe',
            borderRadius: 14, padding: '20px 24px', marginBottom: 24, textAlign: 'center'
          }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Your Complaint ID</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <span style={{ fontSize: 26, fontWeight: 900, color: '#4338ca', letterSpacing: '0.04em' }}>
                {complaint.complaint_id}
              </span>
              <button
                onClick={copyId}
                style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  border: `1px solid ${copied ? '#bbf7d0' : '#c7d2fe'}`,
                  background: copied ? '#f0fdf4' : 'white',
                  color: copied ? '#16a34a' : '#4338ca',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                  transition: 'all 0.2s',
                }}
              >
                <Copy size={13} /> {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Category</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{complaint.category}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{Math.round((complaint.confidence_score || 0) * 100)}% confidence</div>
            </div>
            <div style={{
              padding: '14px 16px', borderRadius: 10,
              background: PRIORITY_BG[priority], border: `1px solid ${PRIORITY_BORDER[priority]}`
            }}>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Priority</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: PRIORITY_COLORS[priority] }}>
                {PRIORITY_EMOJI[priority]} {priority}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>AI-determined</div>
            </div>
          </div>

          {/* Priority reason */}
          {complaint.priority_reason && (
            <div style={{ display: 'flex', gap: 10, padding: '12px 14px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 10, marginBottom: 20 }}>
              <Brain size={15} color="#7c3aed" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700, marginBottom: 2 }}>AI Reasoning</div>
                <div style={{ fontSize: 13, color: '#4c1d95' }}>{complaint.priority_reason}</div>
              </div>
            </div>
          )}

          {/* Estimated time */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 28 }}>
            <Clock size={16} color="#4f46e5" />
            <span style={{ fontSize: 14, color: '#64748b' }}>Estimated resolution: </span>
            <span style={{ fontWeight: 700, color: PRIORITY_COLORS[priority] }}>{RESOLUTION[priority]}</span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link
              to={`/track?id=${complaint.complaint_id}`}
              className="btn-primary"
              style={{ textDecoration: 'none', justifyContent: 'center', padding: '13px', fontSize: 15, borderRadius: 12 }}
            >
              Track My Complaint <ArrowRight size={17} />
            </Link>
            <button onClick={() => navigate('/submit')} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              Submit Another Complaint
            </button>
            <button onClick={() => navigate('/')} className="btn-ghost" style={{ width: '100%', justifyContent: 'center', color: '#94a3b8' }}>
              ← Back to Home
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
