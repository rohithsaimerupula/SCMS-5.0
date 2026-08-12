import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import {
  Brain, LayoutGrid, Table2, Search, RefreshCw,
  AlertTriangle, Clock, CheckCircle, Loader2, ChevronRight,
  LogOut, BarChart3, MessageSquare, Zap
} from 'lucide-react'

const STATUSES = ['Submitted', 'In Review', 'Assigned', 'In Progress', 'Resolved']
const PRIORITY_COLORS = { High: '#dc2626', Medium: '#d97706', Low: '#16a34a' }
const STATUS_DOT = { 'Submitted': '#94a3b8', 'In Review': '#4f46e5', 'Assigned': '#0f766e', 'In Progress': '#b45309', 'Resolved': '#16a34a', 'Closed': '#94a3b8' }
const SLA_HOURS = { High: 4, Medium: 24, Low: 72 }

function isSlaBreached(c) {
  if (c.status === 'Resolved' || c.status === 'Closed') return false
  return (Date.now() - new Date(c.created_at).getTime()) / 3600000 > (SLA_HOURS[c.priority] || 72)
}

function PriorityBadge({ priority }) {
  return <span className={`badge badge-${priority.toLowerCase()}`}>{priority === 'High' ? '🔴' : priority === 'Medium' ? '🟡' : '🟢'} {priority}</span>
}

function StatusBadge({ status }) {
  return <span className={`badge badge-${status.toLowerCase().replace(/ /g, '')}`}>{status}</span>
}

function KanbanCard({ complaint, onClick }) {
  const breached = isSlaBreached(complaint)
  return (
    <div
      className={breached ? 'kanban-card sla-alert' : 'kanban-card'}
      style={breached ? { borderColor: '#ef4444', background: '#fef2f2', boxShadow: '0 0 0 1px #ef4444' } : {}}
      onClick={() => onClick(complaint.id)}
    >
      {breached && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Escalated: Notify HOD
          </span>
        </div>
      )}
      <div style={{ fontSize: 13, color: '#1e293b', marginBottom: 10, lineHeight: 1.5 }}>
        {complaint.text.slice(0, 85)}{complaint.text.length > 85 ? '…' : ''}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <PriorityBadge priority={complaint.priority} />
        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{complaint.complaint_id}</span>
      </div>
      {complaint.location_block && (
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>📍 {complaint.location_block}</div>
      )}
    </div>
  )
}

function KanbanView({ complaints, onSelect }) {
  return (
    <div style={{ display: 'flex', gap: 16, overflowX: 'auto', padding: '4px 0 16px' }}>
      {STATUSES.map((status) => {
        const col = complaints.filter(c => c.status === status)
        const color = STATUS_DOT[status]
        return (
          <div key={status} className="kanban-col" style={{ padding: 16, flexShrink: 0, minHeight: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{status}</span>
              </div>
              <span style={{ background: '#e2e8f0', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700, color: '#475569' }}>{col.length}</span>
            </div>
            <div style={{ maxHeight: 'calc(100vh - 310px)', overflowY: 'auto', paddingRight: 2 }}>
              {col.map(c => <KanbanCard key={c.id} complaint={c} onClick={onSelect} />)}
              {col.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>Empty</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TableView({ complaints, onSelect }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th><th>Description</th><th>Category</th><th>Priority</th><th>Status</th><th>Location</th><th>Submitted</th><th></th>
          </tr>
        </thead>
        <tbody>
          {complaints.map(c => (
            <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => onSelect(c.id)}>
              <td>
                <div style={{ fontWeight: 700, color: '#4338ca', fontSize: 12 }}>{c.complaint_id}</div>
                {isSlaBreached(c) && <div style={{ fontSize: 10, color: '#dc2626', fontWeight: 700, marginTop: 2 }}>⚠️ SLA</div>}
              </td>
              <td style={{ maxWidth: 240 }}>
                <div style={{ fontSize: 13, lineHeight: 1.4, color: '#1e293b' }}>{c.text.slice(0, 70)}{c.text.length > 70 ? '…' : ''}</div>
              </td>
              <td><span style={{ fontSize: 13 }}>{c.category}</span></td>
              <td><PriorityBadge priority={c.priority} /></td>
              <td><StatusBadge status={c.status} /></td>
              <td style={{ color: '#64748b', fontSize: 13 }}>{c.location_block || '—'}</td>
              <td style={{ color: '#94a3b8', fontSize: 12 }}>{format(new Date(c.created_at), 'dd MMM, HH:mm')}</td>
              <td><ChevronRight size={15} color="#94a3b8" /></td>
            </tr>
          ))}
        </tbody>
      </table>
      {complaints.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
          <CheckCircle size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <div style={{ fontSize: 14 }}>No complaints match your filters</div>
        </div>
      )}
    </div>
  )
}

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [complaints, setComplaints] = useState([])
  const [stats, setStats] = useState({})
  const [view, setView] = useState('kanban')
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', category: '', priority: '', search: '' })

  useEffect(() => {
    if (!user || !['admin', 'superadmin'].includes(user.role)) { navigate('/admin/login'); return }
    loadData()
  }, [user])

  const loadData = async () => {
    setLoading(true)
    try {
      const [cRes, sRes] = await Promise.all([adminAPI.listComplaints(), adminAPI.stats()])
      setComplaints(cRes.data); setStats(sRes.data)
    } catch { toast.error('Failed to load data') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        if (filters.semantic && filters.search.length > 5) {
          const res = await adminAPI.semanticSearch(filters.search)
          setComplaints(res.data)
        } else {
          const params = {}
          if (filters.status) params.status = filters.status
          if (filters.category) params.category = filters.category
          if (filters.priority) params.priority = filters.priority
          if (filters.search && !filters.semantic) params.search = filters.search
          const res = await adminAPI.listComplaints(params)
          setComplaints(res.data)
        }
      } catch { }
      finally { setLoading(false) }
    }, 400)
    return () => clearTimeout(t)
  }, [filters])

  if (!user) return null

  const STAT_CARDS = [
    { label: 'Total', value: stats.total, color: '#4f46e5', icon: MessageSquare },
    { label: 'Open', value: stats.open, color: '#d97706', icon: Clock },
    { label: 'Resolved', value: stats.resolved, color: '#16a34a', icon: CheckCircle },
    { label: 'High Priority', value: stats.high_priority, color: '#dc2626', icon: AlertTriangle },
    { label: 'AI Accuracy', value: stats.ai_accuracy ? `${stats.ai_accuracy}%` : null, color: '#7c3aed', icon: Brain },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      {/* Navbar */}
      <nav className="navbar" style={{ padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #4f46e5, #0ea5e9)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain size={18} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>SCMS Admin</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ fontSize: 13, color: '#64748b' }}>{user.name}</div>
          <span className="badge badge-ai" style={{ marginRight: 4 }}>{user.role}</span>
          <button onClick={() => navigate('/admin/qrcodes')} className="btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }}>
            <Zap size={14} /> QR Stations
          </button>
          <button onClick={() => navigate('/admin/analytics')} className="btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }}>
            <BarChart3 size={14} /> Analytics
          </button>
          <button onClick={() => { logout(); navigate('/admin/login') }} className="btn-ghost" style={{ padding: '8px 12px', fontSize: 13 }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </nav>

      <div style={{ padding: '24px 32px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 24 }}>
          {STAT_CARDS.map(({ label, value, color, icon: Icon }) => (
            <motion.div key={label} className="stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ width: 38, height: 38, background: `${color}15`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color={color} />
                </div>
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, color, lineHeight: 1 }}>{value ?? '…'}</div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 6 }}>{label}</div>
            </motion.div>
          ))}
        </div>

        <div className="card" style={{ padding: '14px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 2, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                className="input-field" 
                placeholder={filters.semantic ? "Describe the issue in natural language..." : "Search complaints…"} 
                value={filters.search} 
                onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))} 
                style={{ paddingLeft: 36, padding: '9px 12px 9px 36px', width: '100%' }} 
              />
            </div>
            <button 
              onClick={() => {
                setFilters(f => ({ ...f, semantic: !f.semantic, search: '' }))
              }}
              className={`btn-${filters.semantic ? 'primary' : 'secondary'}`} 
              style={{ padding: '9px 12px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
              title="Semantic Search (AI)"
            >
              <Brain size={14} /> AI Search
            </button>
          </div>
          {[
            { key: 'status', options: ['', ...STATUSES], label: 'Status' },
            { key: 'priority', options: ['', 'High', 'Medium', 'Low'], label: 'Priority' },
            { key: 'category', options: ['', 'Wi-Fi', 'Classroom', 'Laboratory', 'Hostel', 'Transport', 'Washroom', 'Electrical', 'Other'], label: 'Category' },
          ].map(({ key, options, label }) => (
            <select key={key} className="input-field" value={filters[key]} onChange={(e) => setFilters(f => ({ ...f, [key]: e.target.value }))} style={{ padding: '9px 12px', width: 'auto', minWidth: 110, fontSize: 13 }}>
              {options.map(o => <option key={o} value={o}>{o || label}</option>)}
            </select>
          ))}
          <button onClick={loadData} className="btn-ghost" style={{ padding: '9px 12px' }}><RefreshCw size={15} /></button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 8, padding: 4 }}>
            {[{ v: 'kanban', I: LayoutGrid }, { v: 'table', I: Table2 }].map(({ v, I }) => (
              <button key={v} onClick={() => setView(v)} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', background: view === v ? 'white' : 'transparent', color: view === v ? '#4f46e5' : '#94a3b8', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
                <I size={15} /> {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
            <Loader2 size={32} color="#4f46e5" className="spin" />
          </div>
        ) : view === 'kanban' ? (
          <KanbanView complaints={complaints} onSelect={(id) => navigate(`/admin/complaint/${id}`)} />
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <TableView complaints={complaints} onSelect={(id) => navigate(`/admin/complaint/${id}`)} />
          </div>
        )}
      </div>
    </div>
  )
}
