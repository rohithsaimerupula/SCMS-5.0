import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { complaintsAPI } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import {
  FileText, Search, MapPin, CheckCircle, Clock,
  ArrowRight, Users, Loader2, LogOut, ChevronRight
} from 'lucide-react'

const PRIORITY_COLORS = { High: '#dc2626', Medium: '#d97706', Low: '#16a34a' }

function StatusBadge({ status }) {
  return <span className={`badge badge-${status.toLowerCase().replace(/ /g, '')}`}>{status}</span>
}

export default function StudentDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState('history') // 'history' | 'nearme'
  const [myComplaints, setMyComplaints] = useState([])
  const [nearMe, setNearMe] = useState([])
  const [loading, setLoading] = useState(true)
  const [blockFilter, setBlockFilter] = useState('Block B') // Default demo block
  
  const [stats, setStats] = useState({ total: 0, resolved: 0 })

  useEffect(() => {
    if (!user || user.role !== 'student') {
      navigate('/login/student')
      return
    }
    loadData()
  }, [user])

  const loadData = async () => {
    setLoading(true)
    try {
      const [myRes, nearRes] = await Promise.all([
        complaintsAPI.myComplaints(),
        complaintsAPI.list({ location_block: blockFilter })
      ])
      
      setMyComplaints(myRes.data)
      setStats({
        total: myRes.data.length,
        resolved: myRes.data.filter(c => c.status === 'Resolved' || c.status === 'Closed').length
      })
      
      // Filter out user's own complaints from Near Me
      setNearMe(nearRes.data.filter(c => c.student_id !== user.id && c.status !== 'Resolved' && c.status !== 'Closed'))
    } catch {
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'nearme') loadData()
  }, [blockFilter])

  const handleUpvote = async (id) => {
    try {
      await complaintsAPI.upvote(id)
      toast.success('Upvoted!')
      setNearMe(prev => prev.map(c => c.id === id ? { ...c, upvote_count: (c.upvote_count || 1) + 1 } : c))
    } catch {
      toast.error('Failed to upvote')
    }
  }

  if (!user) return null

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Navbar */}
      <nav className="navbar" style={{ padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #4f46e5, #0ea5e9)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={18} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>Student Hub</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ fontSize: 13, color: '#64748b' }}>{user.name}</div>
          <button onClick={() => navigate('/submit')} className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>
            New Complaint
          </button>
          <button onClick={() => { logout(); navigate('/') }} className="btn-ghost" style={{ padding: '8px', fontSize: 13 }}>
            <LogOut size={16} />
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        
        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          <div className="card" style={{ padding: 24, background: 'linear-gradient(135deg, #4f46e5, #3b82f6)', color: 'white', border: 'none' }}>
            <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 8 }}>Total Filed</div>
            <div style={{ fontSize: 36, fontWeight: 800 }}>{stats.total}</div>
          </div>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={16} color="#d97706" /> In Progress
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#0f172a' }}>{stats.total - stats.resolved}</div>
          </div>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={16} color="#16a34a" /> Resolved
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#0f172a' }}>{stats.resolved}</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 24, borderBottom: '2px solid #e2e8f0', marginBottom: 24 }}>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '12px 0', border: 'none', background: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer',
              color: activeTab === 'history' ? '#4f46e5' : '#64748b',
              borderBottom: activeTab === 'history' ? '2px solid #4f46e5' : '2px solid transparent',
              marginBottom: -2
            }}
          >
            My History
          </button>
          <button
            onClick={() => setActiveTab('nearme')}
            style={{
              padding: '12px 0', border: 'none', background: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer',
              color: activeTab === 'nearme' ? '#4f46e5' : '#64748b',
              borderBottom: activeTab === 'nearme' ? '2px solid #4f46e5' : '2px solid transparent',
              marginBottom: -2,
              display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            <MapPin size={16} /> Open Issues Near Me
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <Loader2 size={32} className="spin" color="#4f46e5" />
          </div>
        ) : activeTab === 'history' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {myComplaints.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
                <CheckCircle size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <div style={{ fontSize: 14 }}>You haven't filed any complaints yet.</div>
              </div>
            ) : myComplaints.map(c => (
              <div key={c.id} className="card" style={{ padding: 20, display: 'flex', gap: 16, alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate(`/track?id=${c.complaint_id}`)}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                    {c.text.slice(0, 100)}{c.text.length > 100 ? '...' : ''}
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#64748b', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#4f46e5' }}>{c.complaint_id}</span>
                    <span>{format(new Date(c.created_at), 'dd MMM yyyy')}</span>
                    {c.location_block && <span>📍 {c.location_block}</span>}
                  </div>
                </div>
                <StatusBadge status={c.status} />
                <ChevronRight size={18} color="#cbd5e1" />
              </div>
            ))}
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Filter by Location:</span>
              <select className="input-field" value={blockFilter} onChange={e => setBlockFilter(e.target.value)} style={{ width: 200, padding: '8px 12px' }}>
                <option value="Block A">Block A</option>
                <option value="Block B">Block B</option>
                <option value="Block C">Block C</option>
                <option value="CSE Lab 2">CSE Lab 2</option>
                <option value="Library">Library</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {nearMe.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
                  <MapPin size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <div style={{ fontSize: 14 }}>No other open issues reported in {blockFilter}.</div>
                </div>
              ) : nearMe.map(c => (
                <div key={c.id} className="card" style={{ padding: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                      "{c.text}"
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#64748b', alignItems: 'center' }}>
                      <span className="badge badge-ai" style={{ padding: '2px 8px' }}>{c.category}</span>
                      <span>📍 {c.location_block} {c.location_room ? `(${c.location_room})` : ''}</span>
                      <span>{format(new Date(c.created_at), 'dd MMM')}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                    <StatusBadge status={c.status} />
                    <button
                      onClick={() => handleUpvote(c.id)}
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: 12, gap: 6 }}
                    >
                      <Users size={12} /> Same Issue ({c.upvote_count || 1})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
