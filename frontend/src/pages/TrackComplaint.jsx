import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { complaintsAPI } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import { Search, CheckCircle, Clock, AlertCircle, Loader2, Brain, MapPin, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const STATUS_STEPS = ['Submitted', 'In Review', 'Assigned', 'In Progress', 'Resolved']
const PRIORITY_COLORS = { High: '#dc2626', Medium: '#d97706', Low: '#16a34a' }
const STATUS_ICONS = { 'Submitted': '📝', 'In Review': '🔍', 'Assigned': '👤', 'In Progress': '🔧', 'Resolved': '✅' }

function StatusStepper({ status }) {
  const currentIdx = STATUS_STEPS.indexOf(status)
  return (
    <div style={{ padding: '28px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {STATUS_STEPS.map((step, i) => {
          const done = i < currentIdx
          const active = i === currentIdx
          return (
            <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < STATUS_STEPS.length - 1 ? 1 : 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <motion.div
                  className={`step-dot ${done ? 'step-done' : active ? 'step-active' : 'step-pending'}`}
                  animate={{ scale: active ? [1, 1.08, 1] : 1 }}
                  transition={{ duration: 1.5, repeat: active ? Infinity : 0 }}
                >
                  {done ? <CheckCircle size={16} /> : active ? <Clock size={15} /> : i + 1}
                </motion.div>
                <div style={{
                  fontSize: 11, fontWeight: active ? 700 : 500, textAlign: 'center',
                  maxWidth: 72, lineHeight: 1.3,
                  color: done ? '#4f46e5' : active ? '#0f172a' : '#94a3b8'
                }}>
                  {step}
                </div>
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className="step-line" style={{
                  background: done ? 'linear-gradient(90deg, #4f46e5, #0ea5e9)' : '#e2e8f0',
                  marginBottom: 28
                }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FeedbackWidget({ complaint }) {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [comment, setComment] = useState('')
  const [choice, setChoice] = useState(null)

  const submit = async () => {
    if (choice === null) return
    setLoading(true)
    try {
      await complaintsAPI.feedback(complaint.id, { satisfied_bool: choice, comment })
      setSubmitted(true)
      toast.success('Thank you for your feedback!')
    } catch { toast.error('Failed to submit feedback') }
    finally { setLoading(false) }
  }

  if (submitted) return (
    <div style={{ textAlign: 'center', padding: 24, color: '#16a34a', background: '#f0fdf4', borderRadius: 12 }}>
      <CheckCircle size={28} style={{ margin: '0 auto 8px' }} />
      <div style={{ fontWeight: 600 }}>Feedback recorded. Thank you!</div>
    </div>
  )

  return (
    <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20, marginTop: 20, border: '1px solid #e2e8f0' }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: '#0f172a', display: 'flex', gap: 8, alignItems: 'center' }}>
        <MessageSquare size={16} color="#4f46e5" /> Was this resolved satisfactorily?
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <button
          onClick={() => setChoice(true)}
          style={{ flex: 1, padding: '10px', borderRadius: 10, border: `2px solid ${choice === true ? '#16a34a' : '#e2e8f0'}`, background: choice === true ? '#f0fdf4' : 'white', cursor: 'pointer', color: choice === true ? '#16a34a' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 600, fontSize: 14, transition: 'all 0.15s' }}
        ><ThumbsUp size={16} /> Yes, resolved!</button>
        <button
          onClick={() => setChoice(false)}
          style={{ flex: 1, padding: '10px', borderRadius: 10, border: `2px solid ${choice === false ? '#dc2626' : '#e2e8f0'}`, background: choice === false ? '#fef2f2' : 'white', cursor: 'pointer', color: choice === false ? '#dc2626' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 600, fontSize: 14, transition: 'all 0.15s' }}
        ><ThumbsDown size={16} /> Not yet</button>
      </div>
      <textarea className="input-field" placeholder="Optional comment..." value={comment} onChange={(e) => setComment(e.target.value)} style={{ minHeight: 64, marginBottom: 10, fontSize: 13 }} />
      <button className="btn-primary" onClick={submit} disabled={choice === null || loading} style={{ width: '100%', justifyContent: 'center' }}>
        {loading ? <Loader2 size={15} className="spin" /> : 'Submit Feedback'}
      </button>
    </div>
  )
}

export default function TrackComplaint() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchId, setSearchId] = useState(searchParams.get('id') || '')
  const [complaint, setComplaint] = useState(null)
  const [myComplaints, setMyComplaints] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => { if (searchId) handleSearch() }, [])
  useEffect(() => {
    if (user) complaintsAPI.myComplaints().then(r => setMyComplaints(r.data)).catch(() => {})
  }, [user])

  const handleSearch = async (e) => {
    e?.preventDefault()
    if (!searchId.trim()) return
    setLoading(true); setError(null)
    try {
      const res = await complaintsAPI.track(searchId.trim())
      setComplaint(res.data)
    } catch {
      setError('Complaint not found. Please check the ID.')
      setComplaint(null)
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <nav className="navbar" style={{ padding: '0 40px', height: 64, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('/')} className="btn-ghost" style={{ fontSize: 13 }}>← Back</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={18} color="#4f46e5" />
          <span style={{ fontWeight: 700, color: '#0f172a' }}>Track Complaint</span>
        </div>
      </nav>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '40px 24px' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Track Your Complaint</h1>
          <p style={{ color: '#64748b', marginBottom: 32, fontSize: 14 }}>Enter your Complaint ID to see real-time status and updates.</p>

          {/* Search bar */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 36 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={17} color="#94a3b8" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                className="input-field"
                placeholder="e.g. SCMS-2024-1005"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value.toUpperCase())}
                style={{ paddingLeft: 42, fontSize: 15 }}
              />
            </div>
            <button className="btn-primary" type="submit" disabled={loading} style={{ padding: '11px 24px' }}>
              {loading ? <Loader2 size={16} className="spin" /> : <><Search size={15} /> Track</>}
            </button>
          </form>

          {error && (
            <div style={{ padding: '14px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#dc2626', display: 'flex', gap: 8, marginBottom: 24, fontSize: 14 }}>
              <AlertCircle size={17} style={{ flexShrink: 0 }} /> {error}
            </div>
          )}

          {/* Complaint detail */}
          {complaint && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: 28, marginBottom: 28 }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Complaint ID</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#4338ca' }}>{complaint.complaint_id}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span className={`badge badge-${complaint.priority.toLowerCase()}`}>
                    {complaint.priority === 'High' ? '🔴' : complaint.priority === 'Medium' ? '🟡' : '🟢'} {complaint.priority}
                  </span>
                  <span className={`badge badge-${complaint.status.toLowerCase().replace(/ /g,'')}`}>
                    {STATUS_ICONS[complaint.status]} {complaint.status}
                  </span>
                </div>
              </div>

              <StatusStepper status={complaint.status} />

              {/* Info grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, margin: '4px 0 20px' }}>
                {[
                  { label: 'Category', value: complaint.category },
                  complaint.location_block && { label: 'Location', value: `${complaint.location_block}${complaint.location_room ? ' — ' + complaint.location_room : ''}` },
                  { label: 'Submitted', value: format(new Date(complaint.created_at), 'dd MMM yyyy, HH:mm') },
                  complaint.assigned_to && { label: 'Assigned To', value: complaint.assigned_to },
                ].filter(Boolean).map(({ label, value }) => (
                  <div key={label} style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Complaint text */}
              <div style={{ padding: '14px 16px', background: '#fafafa', borderRadius: 10, marginBottom: 16, borderLeft: `3px solid ${PRIORITY_COLORS[complaint.priority]}` }}>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your Complaint</div>
                <div style={{ lineHeight: 1.65, color: '#1e293b', fontSize: 14 }}>"{complaint.text}"</div>
              </div>

              {/* Photo */}
              {complaint.photo_url && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Attached Photo</div>
                  <img src={complaint.photo_url} alt="complaint" style={{ maxHeight: 200, borderRadius: 10, border: '1px solid #e2e8f0' }} />
                </div>
              )}

              {/* AI reasoning */}
              {complaint.priority_reason && (
                <div style={{ display: 'flex', gap: 10, padding: '12px 14px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 10, marginBottom: 16 }}>
                  <Brain size={15} color="#7c3aed" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700, marginBottom: 2 }}>AI Priority Reasoning</div>
                    <div style={{ fontSize: 13, color: '#4c1d95' }}>{complaint.priority_reason}</div>
                  </div>
                </div>
              )}

              {/* Timeline */}
              {complaint.logs?.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Activity Timeline</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {complaint.logs.map((log, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4f46e5', marginTop: 5, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{log.action}</div>
                          {log.note && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{log.note}</div>}
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{format(new Date(log.timestamp), 'dd MMM yyyy, HH:mm')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {complaint.status === 'Resolved' && <FeedbackWidget complaint={complaint} />}
            </motion.div>
          )}

          {/* My Complaints */}
          {user && myComplaints.length > 0 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>My Complaints</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {myComplaints.map((c) => (
                  <div
                    key={c.id}
                    className="card"
                    onClick={() => { setSearchId(c.complaint_id); setComplaint(c) }}
                    style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#4338ca', fontSize: 13, marginBottom: 3 }}>{c.complaint_id}</div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>{c.text.slice(0, 65)}…</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <span className={`badge badge-${c.priority.toLowerCase()}`}>{c.priority}</span>
                      <span className={`badge badge-${c.status.toLowerCase().replace(/ /g,'')}`}>{c.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
