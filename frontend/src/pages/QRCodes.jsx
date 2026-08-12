import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import QRCode from 'react-qr-code'
import { Printer, ArrowLeft, QrCode } from 'lucide-react'

const BLOCKS = ['Block A', 'Block B', 'Block C', 'Block D', 'Academic Block', 'Science Block', 'Mech Block', 'Library Block', 'Admin Block', 'Canteen Block', 'Campus Road', 'Campus Gate', 'Parking Lot', 'Gate 2', 'Mess Block']

export default function QRCodes() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [baseUrl, setBaseUrl] = useState('')

  useEffect(() => {
    // Only admins should see this page
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      navigate('/')
    }
    setBaseUrl(window.location.origin)
  }, [user, navigate])

  const handlePrint = () => {
    window.print()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Navbar (hidden during print) */}
      <nav className="navbar no-print" style={{ padding: '0 40px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/admin/dashboard')} className="btn-ghost" style={{ fontSize: 13, padding: '8px 12px' }}><ArrowLeft size={16} /> Back to Dashboard</button>
          <div style={{ width: 1, height: 24, background: '#e2e8f0' }} />
          <QrCode size={18} color="#4f46e5" />
          <span style={{ fontWeight: 700, color: '#0f172a' }}>QR Code Generator</span>
        </div>
        <button onClick={handlePrint} className="btn-primary" style={{ padding: '8px 16px', fontSize: 14 }}>
          <Printer size={16} /> Print Stations
        </button>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        <div className="no-print" style={{ marginBottom: 32, textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Complaint Station QR Codes</h1>
          <p style={{ color: '#64748b', fontSize: 15 }}>Print and place these codes around campus. When scanned, they automatically pre-fill the student's location.</p>
        </div>

        {/* CSS for printing */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            .no-print { display: none !important; }
            body { background: white; }
            .qr-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px; }
            .qr-card { break-inside: avoid; border: 2px solid #000; padding: 24px; text-align: center; }
          }
        `}} />

        <div className="qr-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
          {BLOCKS.map(block => {
            const url = `${baseUrl}/submit?block=${encodeURIComponent(block)}`
            return (
              <div key={block} className="qr-card card" style={{ padding: '32px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'white' }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{block}</h2>
                <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>Scan to report an issue here</p>
                <div style={{ padding: 16, background: 'white', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                  <QRCode value={url} size={180} level="M" />
                </div>
                <div style={{ marginTop: 24, fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {url}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
