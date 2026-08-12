import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { complaintsAPI } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Bot, User, ArrowRight, Loader2, Image as ImageIcon, Send } from 'lucide-react'

export default function ChatSubmit() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: "Hi! I'm the SCMS Assistant. What issue would you like to report today?" }
  ])
  const [input, setInput] = useState('')
  const [stage, setStage] = useState('text') // text, location, photo, confirming
  
  // Data collection
  const [complaintText, setComplaintText] = useState('')
  const [block, setBlock] = useState('')
  const [photo, setPhoto] = useState(null)
  
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const addBotMsg = (text) => {
    setMessages(prev => [...prev, { id: Date.now(), sender: 'bot', text }])
  }

  const handleSend = async (e) => {
    e?.preventDefault()
    if (!input.trim() && !photo && stage !== 'photo') return

    const userText = input.trim()
    setInput('')
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: userText || '(Photo uploaded)' }])

    setLoading(true)

    if (stage === 'text') {
      if (userText.length < 10) {
        addBotMsg("Could you provide a bit more detail? It helps our AI route it correctly.")
        setLoading(false)
        return
      }
      setComplaintText(userText)
      // Simulate AI thinking delay for effect
      setTimeout(() => {
        addBotMsg("Got it. Which block or location is this happening in? (e.g. 'Block B' or 'CSE Lab 2')")
        setStage('location')
        setLoading(false)
      }, 800)

    } else if (stage === 'location') {
      setBlock(userText)
      setTimeout(() => {
        addBotMsg("Do you have a photo of the issue? You can attach one below, or just say 'No' to skip.")
        setStage('photo')
        setLoading(false)
      }, 600)

    } else if (stage === 'photo') {
      if (userText.toLowerCase() === 'no' || userText.toLowerCase() === 'skip') {
        setPhoto(null)
      }
      setTimeout(() => {
        addBotMsg("Great, I have everything I need. Should I submit this complaint now?")
        setStage('confirming')
        setLoading(false)
      }, 800)

    } else if (stage === 'confirming') {
      if (userText.toLowerCase() === 'yes' || userText.toLowerCase() === 'submit') {
        doSubmit()
      } else {
        addBotMsg("Okay, submission cancelled. You can go back to the dashboard or start over.")
        setStage('done')
        setLoading(false)
      }
    }
  }

  const doSubmit = async () => {
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('text', complaintText)
      if (block) fd.append('location_block', block)
      fd.append('is_anonymous', 'false')
      if (photo) fd.append('photo', photo)
      
      const res = await complaintsAPI.submit(fd)
      navigate('/submit/success', { state: { complaint: res.data } })
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Submission failed')
      addBotMsg("Sorry, something went wrong while submitting. Please try again.")
      setSubmitting(false)
      setStage('done')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <nav className="navbar" style={{ padding: '0 40px', height: 64, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('/submit')} className="btn-ghost" style={{ fontSize: 13, padding: '8px 12px' }}>← Back to Form</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bot size={18} color="#4f46e5" />
          <span style={{ fontWeight: 700, color: '#0f172a' }}>SCMS Assistant</span>
        </div>
      </nav>

      <div style={{ flex: 1, maxWidth: 800, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', padding: '24px' }}>
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* Chat History */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.map(m => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex',
                  gap: 12,
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%'
                }}
              >
                {m.sender === 'bot' && (
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #4f46e5, #0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bot size={18} color="white" />
                  </div>
                )}
                <div style={{
                  padding: '12px 16px',
                  borderRadius: 16,
                  borderBottomLeftRadius: m.sender === 'bot' ? 4 : 16,
                  borderBottomRightRadius: m.sender === 'user' ? 4 : 16,
                  background: m.sender === 'user' ? '#4f46e5' : '#f1f5f9',
                  color: m.sender === 'user' ? 'white' : '#0f172a',
                  fontSize: 14,
                  lineHeight: 1.5
                }}>
                  {m.text}
                </div>
              </motion.div>
            ))}
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #4f46e5, #0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={18} color="white" />
                </div>
                <div style={{ padding: '12px 16px', borderRadius: 16, background: '#f1f5f9', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div className="bounce-dot" /> <div className="bounce-dot" style={{ animationDelay: '0.2s' }} /> <div className="bounce-dot" style={{ animationDelay: '0.4s' }} />
                </div>
              </motion.div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: 16, borderTop: '1px solid #e2e8f0', background: 'white' }}>
            <form onSubmit={handleSend} style={{ display: 'flex', gap: 12 }}>
              {stage === 'photo' && (
                <div style={{ position: 'relative' }}>
                  <input
                    type="file"
                    id="chat-photo"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        setPhoto(e.target.files[0])
                        setInput('Photo uploaded')
                      }
                    }}
                  />
                  <label htmlFor="chat-photo" className="btn-secondary" style={{ padding: '12px', borderRadius: '50%', cursor: 'pointer' }}>
                    <ImageIcon size={20} color="#64748b" />
                  </label>
                </div>
              )}
              
              <input
                className="input-field"
                placeholder={stage === 'confirming' ? "Type 'yes' to submit..." : "Type your response..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading || submitting || stage === 'done'}
                style={{ borderRadius: 24, paddingLeft: 20 }}
                autoFocus
              />
              <button
                type="submit"
                disabled={loading || submitting || stage === 'done'}
                className="btn-primary"
                style={{ padding: '12px', borderRadius: '50%' }}
              >
                {submitting ? <Loader2 size={20} className="spin" /> : <Send size={20} />}
              </button>
            </form>
          </div>
          
          <style dangerouslySetInnerHTML={{__html: `
            .bounce-dot { width: 6px; height: 6px; background: #94a3b8; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out both; }
            @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
          `}} />
        </div>
      </div>
    </div>
  )
}
