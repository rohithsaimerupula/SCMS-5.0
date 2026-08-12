import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyticsAPI } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { Brain, RefreshCw, Download, ArrowLeft, BarChart3, AlertTriangle, FileText } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const CATEGORY_COLORS = {
  'Wi-Fi': '#4f46e5', 'Electrical': '#dc2626', 'Hostel': '#0f766e',
  'Transport': '#b45309', 'Laboratory': '#7c3aed', 'Classroom': '#be185d',
  'Washroom': '#0369a1', 'Other': '#64748b',
}
const STATUS_COLORS = {
  'Submitted': '#94a3b8', 'In Review': '#4f46e5', 'Assigned': '#0f766e',
  'In Progress': '#b45309', 'Resolved': '#16a34a', 'Closed': '#94a3b8'
}
const PRIORITY_COLORS_MAP = [
  { name: 'High', color: '#dc2626' }, { name: 'Medium', color: '#d97706' }, { name: 'Low', color: '#16a34a' }
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ color: '#64748b', marginBottom: 4, fontWeight: 500 }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color || '#0f172a', fontWeight: 600 }}>{p.name}: {p.value}</div>)}
    </div>
  )
}

function ChartCard({ title, children, action }) {
  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>{title}</h3>
        {action}
      </div>
      {children}
    </div>
  )
}

function InsightCard({ insight }) {
  const variants = {
    info: { border: '#c7d2fe', bg: '#eef2ff', label: '#4338ca' },
    warning: { border: '#fde68a', bg: '#fffbeb', label: '#b45309' },
    critical: { border: '#fecaca', bg: '#fef2f2', label: '#dc2626' },
  }
  const v = variants[insight.type] || variants.info
  return (
    <div style={{ padding: '14px 16px', background: v.bg, border: `1px solid ${v.border}`, borderRadius: 10 }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: v.label, marginBottom: 5 }}>{insight.title}</div>
      <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{insight.body}</div>
    </div>
  )
}

export default function Analytics() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState({})
  const [byCategory, setByCategory] = useState([])
  const [byStatus, setByStatus] = useState([])
  const [byPriority, setByPriority] = useState([])
  const [trend, setTrend] = useState([])
  const [byLocation, setByLocation] = useState([])
  const [insights, setInsights] = useState([])
  const [recurringAlerts, setRecurringAlerts] = useState([])
  const [trendDays, setTrendDays] = useState(30)

  useEffect(() => { loadAll() }, [trendDays])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [ov, cat, sta, pri, tr, loc, ins, rec] = await Promise.all([
        analyticsAPI.overview(), analyticsAPI.byCategory(), analyticsAPI.byStatus(),
        analyticsAPI.byPriority(), analyticsAPI.trend(trendDays), analyticsAPI.byLocation(),
        analyticsAPI.insights(), analyticsAPI.recurringAlerts(),
      ])
      setOverview(ov.data); setByCategory(cat.data); setByStatus(sta.data)
      setByPriority(pri.data); setTrend(tr.data); setByLocation(loc.data.slice(0, 10))
      setInsights(ins.data); setRecurringAlerts(rec.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const exportCSV = () => {
    const rows = [['Metric','Value'], ['Total',overview.total], ['Open',overview.open], ['Resolved',overview.resolved], ['High Priority',overview.high_priority], ['Resolution Rate',`${overview.resolution_rate}%`], ['Avg Resolution',`${Math.round(overview.avg_resolution_hours)}h`]]
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' })
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'scms_analytics.csv' })
    a.click()
  }

  const exportPDF = async () => {
    const element = document.getElementById('analytics-dashboard')
    if (!element) return
    const canvas = await html2canvas(element, { scale: 2 })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    pdf.save(`SCMS_Analytics_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`)
  }

  const STAT_CARDS = [
    { label: 'Total Complaints', value: overview.total, color: '#4f46e5' },
    { label: 'Open Issues', value: overview.open, color: '#d97706' },
    { label: 'Resolved', value: overview.resolved, color: '#16a34a' },
    { label: 'High Priority', value: overview.high_priority, color: '#dc2626' },
    { label: 'Resolution Rate', value: overview.resolution_rate ? `${overview.resolution_rate}%` : null, color: '#0f766e' },
    { label: 'Satisfaction Score', value: overview.satisfaction_score !== null ? `${overview.satisfaction_score}%` : 'N/A', color: '#be185d' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      <nav className="navbar" style={{ padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('/admin/dashboard')} className="btn-ghost" style={{ fontSize: 13 }}>
          <ArrowLeft size={15} /> Dashboard
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart3 size={18} color="#4f46e5" />
          <span style={{ fontWeight: 700, color: '#0f172a' }}>Analytics & Insights</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={loadAll} className="btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }}><RefreshCw size={14} /> Refresh</button>
          <button onClick={exportCSV} className="btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }}><Download size={14} /> Export CSV</button>
          <button onClick={exportPDF} className="btn-primary" style={{ padding: '8px 14px', fontSize: 13 }}><FileText size={14} /> Export PDF</button>
        </div>
      </nav>

      <div id="analytics-dashboard" style={{ maxWidth: 1300, margin: '0 auto', padding: '28px 24px', background: '#f1f5f9' }}>
        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
          {STAT_CARDS.map(({ label, value, color }) => (
            <motion.div key={label} className="stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ fontSize: 38, fontWeight: 900, color, lineHeight: 1 }}>{value ?? '—'}</div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 6 }}>{label}</div>
            </motion.div>
          ))}
        </div>

        {/* Row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <ChartCard title="📊 Complaints by Category">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byCategory} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="category" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[6,6,0,0]}>
                  {byCategory.map((e,i) => <Cell key={i} fill={CATEGORY_COLORS[e.category] || '#4f46e5'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="🔵 Status Distribution">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={byStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={88} innerRadius={48} paddingAngle={3}>
                  {byStatus.map((e,i) => <Cell key={i} fill={STATUS_COLORS[e.status] || '#4f46e5'} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" formatter={(v) => <span style={{ color: '#64748b', fontSize: 12 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Row 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
          <ChartCard
            title="📈 Complaint Trend"
            action={
              <div style={{ display: 'flex', gap: 4 }}>
                {[7,14,30].map(d => (
                  <button key={d} onClick={() => setTrendDays(d)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', fontSize: 12, cursor: 'pointer', fontWeight: 600, background: trendDays===d ? '#eef2ff' : 'transparent', color: trendDays===d ? '#4338ca' : '#94a3b8', transition: 'all 0.15s' }}>{d}d</button>
                ))}
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={trend} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={2.5} dot={false} name="Complaints" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="⚡ Priority Split">
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={byPriority} dataKey="count" nameKey="priority" cx="50%" cy="50%" outerRadius={78} innerRadius={42} paddingAngle={4}>
                  {byPriority.map((e,i) => <Cell key={i} fill={PRIORITY_COLORS_MAP.find(p=>p.name===e.priority)?.color || '#64748b'} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" formatter={(v) => <span style={{ color: '#64748b', fontSize: 12 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Row 3 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <ChartCard title="🗺️ Complaints by Location">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={byLocation} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis dataKey="location" type="category" tick={{ fill: '#64748b', fontSize: 11 }} width={88} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#0ea5e9" radius={[0,6,6,0]} name="Complaints" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="🧠 AI Insights">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 290, overflowY: 'auto' }}>
              {insights.map((ins, i) => <InsightCard key={i} insight={ins} />)}
              {insights.length === 0 && <div style={{ color: '#94a3b8', textAlign: 'center', padding: 30, fontSize: 14 }}>Generating insights...</div>}
            </div>
          </ChartCard>
        </div>

        {/* Recurring Alerts */}
        {recurringAlerts.length > 0 && (
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, background: '#fef2f2', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={18} color="#dc2626" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>🔁 Recurring Problem Alerts</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
              {recurringAlerts.map((alert, i) => (
                <div key={i} style={{ padding: '14px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10 }}>
                  <div style={{ fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>{alert.category} — {alert.location_block}</div>
                  <div style={{ color: '#64748b', fontSize: 13, marginBottom: 8 }}>{alert.message}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#b91c1c' }}>{alert.count}×</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
