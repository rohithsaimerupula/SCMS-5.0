import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminAPI } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { Brain, ArrowLeft, Loader2, CheckCircle, GitMerge, MapPin } from 'lucide-react'

const STATUSES = ['Submitted', 'In Review', 'Assigned', 'In Progress', 'Resolved']
const PRIORITY_COLORS = { High: '#dc2626', Medium: '#d97706', Low: '#16a34a' }
const PRIORITY_BG = { High: '#fef2f2', Medium: '#fffbeb', Low: '#f0fdf4' }

export default function ComplaintDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [complaint, setComplaint] = useState(null)
  const [similar, setSimilar] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [newPriority, setNewPriority] = useState('')
  const [newNote, setNewNote] = useState('')
  const [assignTo, setAssignTo] = useState('')
  const [rcaReport, setRcaReport] = useState(null)
  const [generatingRCA, setGeneratingRCA] = useState(false)

  useEffect(() => {
    if (!user || !['admin', 'superadmin'].includes(user.role)) navigate('/admin/login')
    loadComplaint()
  }, [id])

  const loadComplaint = async () => {
    setLoading(true)
    try {
      const [cRes, sRes] = await Promise.all([adminAPI.getComplaint(id), adminAPI.getSimilar(id)])
      setComplaint(cRes.data); setSimilar(sRes.data || [])
      setNewStatus(cRes.data.status); setNewPriority(cRes.data.priority)
      setAssignTo(cRes.data.assigned_to || '')
    } catch { toast.error('Complaint not found'); navigate('/admin/dashboard') }
    finally { setLoading(false) }
  }

  const handleUpdate = async () => {
    setUpdating(true)
    try {
      await adminAPI.updateComplaint(id, { status: newStatus, priority: newPriority, assigned_to: assignTo || undefined, internal_note: newNote || undefined })
      toast.success('Complaint updated!')
      await loadComplaint(); setNewNote('')
    } catch { toast.error('Update failed') }
    finally { setUpdating(false) }
  }

  const handleMerge = async (targetId) => {
    if (!window.confirm('Merge this complaint into the selected one?')) return
    try {
      await adminAPI.mergeComplaints(parseInt(id), targetId)
      toast.success('Complaints merged!'); navigate('/admin/dashboard')
    } catch { toast.error('Merge failed') }
  }

  const handleGenerateRCA = async () => {
    setGeneratingRCA(true)
    try {
      const res = await adminAPI.getRCA(id)
      setRcaReport(res.data.rca_report)
      toast.success('RCA Generated Successfully')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to generate RCA')
    } finally {
      setGeneratingRCA(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
      <Loader2 size={36} color="#4f46e5" className="spin" />
    </div>
  )
  if (!complaint) return null

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      <nav className="navbar" style={{ padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => navigate('/admin/dashboard')} className="btn-ghost" style={{ fontSize: 13 }}>
          <ArrowLeft size={15} /> Dashboard
        </button>
        <span style={{ color: '#e2e8f0' }}>/</span>
        <span style={{ fontWeight: 700, color: '#4338ca' }}>{complaint.complaint_id}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <span className={`badge badge-${complaint.priority.toLowerCase()}`}>
            {complaint.priority === 'High' ? '🔴' : complaint.priority === 'Medium' ? '🟡' : '🟢'} {complaint.priority}
          </span>
          <span className={`badge badge-${complaint.status.toLowerCase().replace(/ /g,'')}`}>{complaint.status}</span>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px', display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>
        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Complaint text */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: 28 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Complaint Details</h2>
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: 10, lineHeight: 1.7, color: '#1e293b', borderLeft: `3px solid ${PRIORITY_COLORS[complaint.priority]}`, marginBottom: 18 }}>
              {complaint.text}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
              {[
                { label: 'Category', value: `${complaint.category}${complaint.category_overridden ? ' ✏️' : ''}` },
                { label: 'Confidence', value: `${Math.round((complaint.confidence_score || 0) * 100)}%` },
                { label: 'Upvotes', value: `👥 ${complaint.upvote_count} students` },
                { label: 'Anonymous', value: complaint.is_anonymous ? 'Yes' : 'No' },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{value}</div>
                </div>
              ))}
            </div>
            {complaint.location_block && (
              <div style={{ marginTop: 12, display: 'flex', gap: 7, alignItems: 'center', color: '#64748b', fontSize: 13 }}>
                <MapPin size={14} color="#4f46e5" />
                {complaint.location_block}{complaint.location_room ? ` — ${complaint.location_room}` : ''}
              </div>
            )}
            {complaint.photo_url && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Attached Photo</div>
                <img src={complaint.photo_url} alt="complaint" style={{ maxHeight: 220, borderRadius: 10, border: '1px solid #e2e8f0' }} />
              </div>
            )}
          </motion.div>

          {/* AI Reasoning */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, background: '#f5f3ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Brain size={18} color="#7c3aed" />
              </div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>AI Reasoning Panel</h2>
            </div>
            <div style={{ padding: '14px 16px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 10, marginBottom: complaint.category_overridden ? 12 : 0 }}>
              <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Priority Reasoning</div>
              <div style={{ color: '#4c1d95', lineHeight: 1.65, fontSize: 14 }}>{complaint.priority_reason || 'Standard classification applied.'}</div>
            </div>
            {complaint.category_overridden && (
              <div style={{ padding: '12px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, fontSize: 13, color: '#92400e' }}>
                ⚠️ Category manually overridden from AI suggestion ({complaint.ai_category}) to "{complaint.category}"
              </div>
            )}
          </motion.div>

          {/* RCA Report */}
          {rcaReport && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: 28 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, background: '#f5f3ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Brain size={18} color="#7c3aed" />
                </div>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>Root Cause Analysis</h2>
              </div>
              <div style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#1e293b', fontSize: 14 }}>
                {rcaReport}
              </div>
            </motion.div>
          )}

          {/* Similar complaints */}
          {similar.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="card" style={{ padding: 28 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, background: '#f0fdfa', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GitMerge size={18} color="#0f766e" />
                </div>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Similar Complaints
                  <span style={{ marginLeft: 8, fontSize: 12, background: '#f0fdfa', color: '#0f766e', padding: '2px 8px', borderRadius: 20, border: '1px solid #99f6e4' }}>{similar.length}</span>
                </h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {similar.map((s) => (
                  <div key={s.id} style={{ padding: 14, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: '#4338ca', fontWeight: 700, marginBottom: 5 }}>{s.complaint_id}</div>
                      <div style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.5 }}>{s.text.slice(0, 100)}…</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 5 }}>Match: <span style={{ color: '#16a34a', fontWeight: 700 }}>{Math.round(s.similarity * 100)}%</span></div>
                    </div>
                    <button onClick={() => handleMerge(s.id)} className="btn-secondary" style={{ padding: '7px 12px', fontSize: 12, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      <GitMerge size={13} /> Merge
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Activity log */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} className="card" style={{ padding: 28 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Activity Log</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {complaint.logs?.map((log, i) => (
                <div key={i} style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4f46e5', marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{log.action}</div>
                    {log.note && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{log.note}</div>}
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{format(new Date(log.timestamp), 'dd MMM yyyy, HH:mm')}</div>
                  </div>
                </div>
              ))}
              {(!complaint.logs || complaint.logs.length === 0) && <div style={{ color: '#94a3b8', fontSize: 13 }}>No activity yet.</div>}
            </div>
          </motion.div>

          {/* Feedback section */}
          {complaint.feedback && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card" style={{ padding: 28 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, background: complaint.feedback.satisfied_bool ? '#f0fdf4' : '#fef2f2', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle size={18} color={complaint.feedback.satisfied_bool ? '#16a34a' : '#dc2626'} />
                </div>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>Student Feedback</h2>
              </div>
              <div style={{ padding: '16px', background: complaint.feedback.satisfied_bool ? '#f0fdf4' : '#fef2f2', border: `1px solid ${complaint.feedback.satisfied_bool ? '#bbf7d0' : '#fecaca'}`, borderRadius: 10 }}>
                <div style={{ fontWeight: 700, color: complaint.feedback.satisfied_bool ? '#16a34a' : '#dc2626', marginBottom: 6 }}>
                  {complaint.feedback.satisfied_bool ? 'Satisfied with resolution' : 'Not satisfied with resolution'}
                </div>
                {complaint.feedback.comment && (
                  <div style={{ fontSize: 14, color: '#1e293b', marginTop: 8 }}>"{complaint.feedback.comment}"</div>
                )}
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 10 }}>{format(new Date(complaint.feedback.created_at), 'dd MMM yyyy, HH:mm')}</div>
              </div>
            </motion.div>
          )}
        </div>

        {/* RIGHT — Actions panel */}
        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Quick Actions</h3>

            <div style={{ marginBottom: 14 }}>
              <label className="form-label">Status</label>
              <select className="input-field" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} style={{ padding: '10px 12px' }}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label className="form-label">Priority</label>
              <select className="input-field" value={newPriority} onChange={(e) => setNewPriority(e.target.value)} style={{ padding: '10px 12px' }}>
                {['High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label className="form-label">Assign To</label>
              <input className="input-field" placeholder="e.g. Maintenance Team" value={assignTo} onChange={(e) => setAssignTo(e.target.value)} style={{ padding: '10px 12px' }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Internal Note</label>
              <textarea className="input-field" placeholder="Add a note..." value={newNote} onChange={(e) => setNewNote(e.target.value)} style={{ minHeight: 80, padding: '10px 12px', fontSize: 13 }} />
            </div>

            <button className="btn-primary" onClick={handleUpdate} disabled={updating} style={{ width: '100%', justifyContent: 'center', padding: '12px', borderRadius: 10 }}>
              {updating ? <Loader2 size={16} className="spin" /> : <><CheckCircle size={15} /> Save Changes</>}
            </button>

            {newStatus !== 'Resolved' && (
              <button
                className="btn-ghost"
                onClick={() => { setNewStatus('Resolved'); setTimeout(handleUpdate, 100) }}
                style={{ width: '100%', justifyContent: 'center', marginTop: 8, color: '#16a34a', fontWeight: 700 }}
              >
                <CheckCircle size={15} color="#16a34a" /> Mark as Resolved
              </button>
            )}

            {complaint.status === 'Resolved' && (
              <button
                className="btn-secondary"
                onClick={handleGenerateRCA}
                disabled={generatingRCA}
                style={{ width: '100%', justifyContent: 'center', marginTop: 12, padding: '10px', borderColor: '#8b5cf6', color: '#6d28d9', background: '#f5f3ff' }}
              >
                {generatingRCA ? <Loader2 size={16} className="spin" /> : <><Brain size={15} /> Generate RCA Report</>}
              </button>
            )}
          </div>

          {/* Meta */}
          <div className="card-flat" style={{ padding: 18 }}>
            <div className="section-label" style={{ marginBottom: 12 }}>Complaint Meta</div>
            {[
              ['Submitted', format(new Date(complaint.created_at), 'dd MMM yyyy, HH:mm')],
              ['Last Updated', format(new Date(complaint.updated_at), 'dd MMM yyyy, HH:mm')],
              complaint.resolved_at && ['Resolved At', format(new Date(complaint.resolved_at), 'dd MMM yyyy, HH:mm')],
            ].filter(Boolean).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: '#94a3b8' }}>{k}</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{v}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
