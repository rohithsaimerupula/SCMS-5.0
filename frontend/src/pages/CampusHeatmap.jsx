import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyticsAPI } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Map, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

// Mock coordinates for the blocks on our SVG "map"
const BLOCK_COORDS = {
  'Block A': { x: 20, y: 20, width: 25, height: 25 },
  'Block B': { x: 60, y: 20, width: 25, height: 25 },
  'Block C': { x: 20, y: 60, width: 25, height: 25 },
  'Block D': { x: 60, y: 60, width: 25, height: 25 },
  'Block E': { x: 40, y: 40, width: 20, height: 20 },
}

export default function CampusHeatmap() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [locationData, setLocationData] = useState([])
  const [selectedBlock, setSelectedBlock] = useState(null)
  
  useEffect(() => {
    if (!user || !['admin', 'superadmin'].includes(user.role)) {
      navigate('/admin/login')
      return
    }
    loadData()
  }, [user])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await analyticsAPI.byLocation()
      setLocationData(res.data)
    } catch (e) {
      toast.error('Failed to load heatmap data')
    } finally {
      setLoading(false)
    }
  }

  const getHeatColor = (count) => {
    if (count >= 10) return 'rgba(220, 38, 38, 0.7)' // Red
    if (count >= 5) return 'rgba(217, 119, 6, 0.7)' // Orange
    if (count > 0) return 'rgba(22, 163, 74, 0.7)' // Green
    return 'rgba(148, 163, 184, 0.2)' // Gray
  }

  const getBubbleSize = (count) => {
    return Math.min(20 + count * 2, 60)
  }

  if (!user) return null

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      <nav className="navbar" style={{ padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('/admin/dashboard')} className="btn-ghost" style={{ fontSize: 13 }}>
          <ArrowLeft size={15} /> Dashboard
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Map size={18} color="#4f46e5" />
          <span style={{ fontWeight: 700, color: '#0f172a' }}>Digital Twin: Campus Heatmap</span>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 32px', display: 'flex', gap: 24 }}>
        
        {/* Heatmap Area */}
        <div className="card" style={{ flex: 2, padding: 32, position: 'relative', overflow: 'hidden', minHeight: 600 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 24, display: 'flex', justifyContent: 'space-between' }}>
            Live Issue Density
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Campus Map Overlay</span>
          </h2>

          {loading ? (
            <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={32} color="#4f46e5" className="spin" />
            </div>
          ) : (
            <div style={{ position: 'relative', width: '100%', paddingBottom: '75%', background: '#e2e8f0', borderRadius: 16, overflow: 'hidden', border: '2px solid #cbd5e1' }}>
              
              {/* SVG Background Map */}
              <svg viewBox="0 0 100 100" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                <rect x="0" y="0" width="100" height="100" fill="#f8fafc" />
                
                {/* Roads/Paths */}
                <path d="M 0 50 L 100 50 M 50 0 L 50 100" stroke="#e2e8f0" strokeWidth="4" />
                
                {/* Blocks */}
                {Object.entries(BLOCK_COORDS).map(([block, coords]) => (
                  <g key={block}>
                    <rect 
                      x={coords.x} y={coords.y} 
                      width={coords.width} height={coords.height} 
                      rx="2" 
                      fill="#fff" 
                      stroke="#cbd5e1" 
                      strokeWidth="0.5" 
                    />
                    <text 
                      x={coords.x + coords.width/2} 
                      y={coords.y + 4} 
                      fontSize="3" 
                      fontWeight="bold" 
                      fill="#64748b" 
                      textAnchor="middle"
                    >
                      {block}
                    </text>
                  </g>
                ))}
              </svg>

              {/* Heat Bubbles Overlay */}
              {locationData.map((loc, i) => {
                const coords = BLOCK_COORDS[loc.location]
                if (!coords) return null
                
                const size = getBubbleSize(loc.count)
                const color = getHeatColor(loc.count)
                
                return (
                  <motion.div
                    key={loc.location}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.1, type: 'spring' }}
                    onClick={() => setSelectedBlock(loc)}
                    style={{
                      position: 'absolute',
                      left: `${coords.x + coords.width/2}%`,
                      top: `${coords.y + coords.height/2}%`,
                      width: `${size}%`,
                      height: `${size}%`,
                      transform: 'translate(-50%, -50%)',
                      background: color,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      border: '2px solid rgba(255,255,255,0.5)',
                      zIndex: 10
                    }}
                  >
                    <span style={{ color: 'white', fontWeight: 800, fontSize: '1.2vw', textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                      {loc.count}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 24, flex: 1 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Block Details</h3>
            
            <AnimatePresence mode="wait">
              {selectedBlock ? (
                <motion.div
                  key={selectedBlock.location}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                >
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#4f46e5', marginBottom: 4 }}>
                    {selectedBlock.location}
                  </div>
                  <div style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>
                    Active Issues: <span style={{ fontWeight: 700, color: '#0f172a' }}>{selectedBlock.count}</span>
                  </div>
                  
                  <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 8, fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
                    This block is currently experiencing {selectedBlock.count > 5 ? 'high' : 'normal'} volume. 
                    {selectedBlock.count >= 10 && <div style={{ color: '#dc2626', fontWeight: 700, marginTop: 8 }}>⚠️ Urgent maintenance attention recommended.</div>}
                  </div>
                  
                  <button 
                    className="btn-secondary" 
                    onClick={() => navigate('/admin/dashboard')}
                    style={{ width: '100%', marginTop: 24, justifyContent: 'center' }}
                  >
                    View Complaints
                  </button>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>
                  Click a heat bubble on the map to view block details.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
