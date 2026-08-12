import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { complaintsAPI } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Brain, Upload, X, CheckCircle, AlertTriangle, Loader2,
  MapPin, Eye, EyeOff, ArrowRight, Users, Sparkles, ChevronRight, Mic
} from 'lucide-react'

const CATEGORIES = ['Wi-Fi', 'Classroom', 'Laboratory', 'Hostel', 'Transport', 'Washroom', 'Electrical', 'Other']
const BLOCKS = ['Block A', 'Block B', 'Block C', 'Block D', 'Academic Block', 'Science Block', 'Mech Block', 'Library Block', 'Admin Block', 'Canteen Block', 'Campus Road', 'Campus Gate', 'Parking Lot', 'Gate 2', 'Mess Block']

const PRIORITY_COLORS = { High: '#dc2626', Medium: '#d97706', Low: '#16a34a' }
const PRIORITY_BG = { High: '#fef2f2', Medium: '#fffbeb', Low: '#f0fdf4' }

function AICategoryChip({ preview, loading }) {
  if (loading) return (
    <div className="ai-chip" style={{ marginTop: 10 }}>
      <Loader2 size={16} color="#4f46e5" className="spin" />
      <span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>AI is analysing your complaint...</span>
    </div>
  )
  if (!preview) return null
  return (
    <motion.div className="ai-chip" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 10 }}>
      <Sparkles size={16} color="#4f46e5" />
      <div style={{ flex: 1, fontSize: 13 }}>
        <span style={{ color: '#64748b' }}>AI Detected: </span>
        <strong style={{ color: '#4f46e5' }}>{preview.category}</strong>
        <span style={{ color: '#94a3b8' }}> · {preview.confidence}% confidence</span>
        <span style={{ marginLeft: 10, fontWeight: 700, color: PRIORITY_COLORS[preview.priority] }}>
          ● {preview.priority} Priority
        </span>
      </div>
      <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>→ {preview.department}</span>
    </motion.div>
  )
}

function DuplicateModal({ similar, onUpvote, onProceed, onClose }) {
  const [upvoted, setUpvoted] = useState(null)

  const handleUpvote = async (id) => {
    try {
      await complaintsAPI.upvote(id)
      setUpvoted(id)
      toast.success('Your support added to the existing complaint!')
      setTimeout(() => { onUpvote(id); onClose() }, 1500)
    } catch { toast.error('Failed to upvote') }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="card"
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 600, width: '100%', padding: 32 }}
      >
        {/* Header */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, background: '#fffbeb', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={22} color="#d97706" />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>Similar Complaints Found</h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>{similar.length} student(s) already reported a similar issue this week</p>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 6, borderRadius: 8, alignSelf: 'flex-start' }}>
            <X size={18} />
          </button>
        </div>

        {/* Similar cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto', marginBottom: 24 }}>
          {similar.map((s) => (
            <div key={s.id} style={{ padding: 16, border: '1.5px solid #e2e8f0', borderRadius: 12, display: 'flex', gap: 14, alignItems: 'flex-start', background: '#fafafa' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, lineHeight: 1.55, color: '#1e293b', marginBottom: 8 }}>
                  "{s.text.slice(0, 110)}{s.text.length > 110 ? '…' : ''}"
                </div>
                <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#94a3b8' }}>
                  <span style={{ fontWeight: 600, color: '#4f46e5' }}>#{s.complaint_id}</span>
                  {s.location_block && <span>📍 {s.location_block}</span>}
                  <span>👥 {s.upvote_count} students</span>
                  <span style={{ color: '#16a34a', fontWeight: 600 }}>{Math.round(s.similarity * 100)}% match</span>
                </div>
              </div>
              <button
                onClick={() => handleUpvote(s.id)}
                disabled={upvoted !== null}
                style={{
                  padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  whiteSpace: 'nowrap', flexShrink: 0, border: '1.5px solid',
                  background: upvoted === s.id ? '#f0fdf4' : '#eef2ff',
                  borderColor: upvoted === s.id ? '#bbf7d0' : '#c7d2fe',
                  color: upvoted === s.id ? '#16a34a' : '#4338ca',
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.2s',
                }}
              >
                {upvoted === s.id ? <CheckCircle size={14} /> : <Users size={14} />}
                {upvoted === s.id ? 'Added!' : 'Same Issue'}
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
          <button className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button className="btn-primary" onClick={onProceed} style={{ flex: 2, justifyContent: 'center' }}>
            Submit as New Complaint <ChevronRight size={16} />
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function SubmitComplaint() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [category, setCategory] = useState('')
  const [block, setBlock] = useState('')
  const [floor, setFloor] = useState('')
  const [room, setRoom] = useState('')
  const [isAnon, setIsAnon] = useState(false)
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [preview, setPreview] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [similar, setSimilar] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const fileRef = useRef(null)
  const debounceRef = useRef(null)

  const startRecording = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error('Voice input is not supported in this browser.')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => setIsRecording(true)
    
    recognition.onresult = (event) => {
      let finalTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        }
      }
      if (finalTranscript) {
        setText((prev) => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + finalTranscript)
      }
    }

    recognition.onerror = (event) => {
      console.error(event.error)
      setIsRecording(false)
      toast.error('Voice recognition failed')
    }

    recognition.onend = () => setIsRecording(false)

    recognition.start()
    
    // Auto-stop after 10 seconds of silence/speaking
    setTimeout(() => {
      recognition.stop()
    }, 10000)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (text.length < 15) { setPreview(null); setAiLoading(false); return }
    setAiLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await complaintsAPI.aiPreview(text)
        setPreview(res.data)
        if (!category) setCategory(res.data.category)
      } catch { }
      finally { setAiLoading(false) }
    }, 1500)
    return () => clearTimeout(debounceRef.current)
  }, [text])

  const handleFile = (file) => {
    if (!file) return
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [])

  const handlePreSubmit = async (e) => {
    e.preventDefault()
    if (text.trim().length < 10) { toast.error('Please describe the issue in more detail'); return }
    try {
      const res = await complaintsAPI.checkSimilar(text, preview?.category || category, block)
      if (res.data.length > 0) { setSimilar(res.data); setShowModal(true); return }
    } catch { }
    await doSubmit()
  }

  const doSubmit = async () => {
    setSubmitting(true); setShowModal(false)
    try {
      const fd = new FormData()
      fd.append('text', text)
      if (block) fd.append('location_block', block)
      if (floor) fd.append('location_floor', floor)
      if (room) fd.append('location_room', room)
      if (category && category !== preview?.category) fd.append('category_override', category)
      fd.append('is_anonymous', isAnon)
      if (photo) fd.append('photo', photo)
      const res = await complaintsAPI.submit(fd)
      navigate('/submit/success', { state: { complaint: res.data } })
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Submission failed')
    } finally { setSubmitting(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Navbar */}
      <nav className="navbar" style={{ padding: '0 40px', height: 64, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('/')} className="btn-ghost" style={{ fontSize: 13, padding: '8px 12px' }}>← Back</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Brain size={18} color="#4f46e5" />
          <span style={{ fontWeight: 700, color: '#0f172a' }}>Report an Issue</span>
        </div>
        {user && !isAnon && (
          <div style={{ marginLeft: 'auto', fontSize: 13, color: '#64748b' }}>
            Submitting as <strong style={{ color: '#0f172a' }}>{user.name}</strong>
          </div>
        )}
      </nav>

      <div style={{ maxWidth: 740, margin: '0 auto', padding: '40px 24px' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Describe Your Issue</h1>
          <p style={{ color: '#64748b', marginBottom: 32, fontSize: 14 }}>
            AI will auto-detect the category, priority and route it to the right department.
          </p>

          <form onSubmit={handlePreSubmit}>
            {/* Complaint text */}
            <div className="card" style={{ padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label className="form-label" style={{ margin: 0 }}>
                  What's the issue? <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={isRecording}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                    borderRadius: 20, border: 'none', fontSize: 13, fontWeight: 600,
                    background: isRecording ? '#fee2e2' : '#eef2ff',
                    color: isRecording ? '#ef4444' : '#4f46e5',
                    cursor: isRecording ? 'default' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {isRecording ? <Loader2 size={14} className="spin" /> : <Mic size={14} />}
                  {isRecording ? 'Listening...' : 'Speak Issue'}
                </button>
              </div>
              <textarea
                className="input-field"
                placeholder='Describe the problem in detail — e.g. "AC not working in CSE Lab 2, it is extremely hot and students cannot concentrate..."'
                value={text}
                onChange={(e) => setText(e.target.value)}
                style={{ minHeight: 140, fontSize: 14 }}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                <span style={{ fontSize: 12, color: text.length < 10 ? '#ef4444' : '#94a3b8' }}>
                  {text.length} chars {text.length < 10 && text.length > 0 ? '(min 10)' : ''}
                </span>
              </div>
              <AICategoryChip preview={preview} loading={aiLoading} />
            </div>

            {/* Location */}
            <div className="card" style={{ padding: 24, marginBottom: 20 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={14} color="#4f46e5" /> Location Details
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, fontWeight: 500 }}>Block / Area</div>
                  <select className="input-field" value={block} onChange={(e) => setBlock(e.target.value)}>
                    <option value="">Select Block</option>
                    {BLOCKS.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, fontWeight: 500 }}>Floor</div>
                  <input className="input-field" placeholder="e.g. 2nd Floor" value={floor} onChange={(e) => setFloor(e.target.value)} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, fontWeight: 500 }}>Room / Area</div>
                  <input className="input-field" placeholder="e.g. Room 201" value={room} onChange={(e) => setRoom(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Category */}
            <div className="card" style={{ padding: 24, marginBottom: 20 }}>
              <label className="form-label">
                Category
                {preview && category !== preview.category && (
                  <span style={{ marginLeft: 8, fontSize: 11, color: '#d97706', fontWeight: 500 }}>
                    (AI suggests: {preview.category})
                  </span>
                )}
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {CATEGORIES.map(c => (
                  <button
                    key={c} type="button" onClick={() => setCategory(c)}
                    style={{
                      padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      border: `1.5px solid ${category === c ? '#4f46e5' : '#e2e8f0'}`,
                      background: category === c ? '#eef2ff' : 'white',
                      color: category === c ? '#4338ca' : '#64748b',
                      transition: 'all 0.15s',
                    }}
                  >{c}</button>
                ))}
              </div>
            </div>

            {/* Photo upload */}
            <div className="card" style={{ padding: 24, marginBottom: 20 }}>
              <label className="form-label">
                <Upload size={13} style={{ marginRight: 5 }} />Photo Evidence <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
              </label>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? '#4f46e5' : '#e2e8f0'}`,
                  borderRadius: 12, padding: 24, textAlign: 'center', cursor: 'pointer',
                  background: dragOver ? '#eef2ff' : '#fafafa', transition: 'all 0.2s',
                }}
              >
                {photoPreview ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={photoPreview} alt="preview" style={{ maxHeight: 160, borderRadius: 10 }} />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPhoto(null); setPhotoPreview(null) }}
                      style={{ position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: '50%', background: '#ef4444', border: '2px solid white', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    ><X size={12} /></button>
                  </div>
                ) : (
                  <>
                    <Upload size={28} color="#94a3b8" style={{ marginBottom: 8 }} />
                    <p style={{ color: '#64748b', margin: 0, fontSize: 14, fontWeight: 500 }}>Drag & drop or click to upload</p>
                    <p style={{ color: '#94a3b8', margin: '4px 0 0', fontSize: 12 }}>PNG, JPG, WebP — max 10MB</p>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />
            </div>

            {/* Anonymous toggle */}
            <div className="card" style={{ padding: '16px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
              <button
                type="button"
                onClick={() => setIsAnon(!isAnon)}
                className="toggle-track"
                style={{ background: isAnon ? '#4f46e5' : '#e2e8f0' }}
              >
                <div className="toggle-thumb" style={{ left: isAnon ? 23 : 3 }} />
              </button>
              {isAnon ? <EyeOff size={16} color="#4f46e5" /> : <Eye size={16} color="#94a3b8" />}
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>
                  {isAnon ? 'Anonymous Submission' : 'Submit with Identity'}
                </div>
                <div style={{ color: '#94a3b8', fontSize: 12 }}>
                  {isAnon ? 'Your identity will not be shared with anyone' : user ? `Submitting as ${user.name}` : 'Login to link with your account'}
                </div>
              </div>
            </div>

            {/* AI Summary */}
            <AnimatePresence>
              {preview && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="card"
                  style={{ padding: 20, marginBottom: 24, borderColor: '#c7d2fe', background: '#fafbff' }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5', marginBottom: 14, display: 'flex', gap: 6, alignItems: 'center', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    <Brain size={13} /> AI Analysis Summary
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                    {[
                      { label: 'Category', value: preview.category },
                      { label: 'Confidence', value: `${preview.confidence}%` },
                      { label: 'Priority', value: preview.priority, color: PRIORITY_COLORS[preview.priority] },
                      { label: 'Department', value: preview.department },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ padding: '10px 12px', background: 'white', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: color || '#0f172a' }}>{value}</div>
                      </div>
                    ))}
                  </div>
                  {preview.priority_reason && (
                    <div style={{ marginTop: 12, fontSize: 12, color: '#64748b', padding: '8px 12px', background: '#f8fafc', borderRadius: 8, borderLeft: '3px solid #4f46e5' }}>
                      💡 {preview.priority_reason}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || text.length < 10}
              style={{ width: '100%', justifyContent: 'center', padding: '15px', fontSize: 16, borderRadius: 12 }}
            >
              {submitting
                ? <><Loader2 size={18} className="spin" /> Submitting...</>
                : <>Submit Complaint <ArrowRight size={18} /></>}
            </button>
          </form>
        </motion.div>
      </div>

      <AnimatePresence>
        {showModal && <DuplicateModal similar={similar} onUpvote={() => {}} onProceed={doSubmit} onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  )
}
