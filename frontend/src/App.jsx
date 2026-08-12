import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import Landing from './pages/Landing'
import SubmitComplaint from './pages/SubmitComplaint'
import SubmitSuccess from './pages/SubmitSuccess'
import TrackComplaint from './pages/TrackComplaint'
import AdminLogin from './pages/AdminLogin'
import StudentLogin from './pages/StudentLogin'
import StudentDashboard from './pages/StudentDashboard'
import AdminDashboard from './pages/AdminDashboard'
import ComplaintDetail from './pages/ComplaintDetail'
import Analytics from './pages/Analytics'
import QRCodes from './pages/QRCodes'
import ChatSubmit from './pages/ChatSubmit'
import CampusHeatmap from './pages/CampusHeatmap'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1c1c28',
              color: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/submit" element={<SubmitComplaint />} />
          <Route path="/submit/chat" element={<ChatSubmit />} />
          <Route path="/submit/success" element={<SubmitSuccess />} />
          <Route path="/track" element={<TrackComplaint />} />
          <Route path="/login/student" element={<StudentLogin />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/complaint/:id" element={<ComplaintDetail />} />
          <Route path="/admin/analytics" element={<Analytics />} />
          <Route path="/admin/qrcodes" element={<QRCodes />} />
          <Route path="/admin/heatmap" element={<CampusHeatmap />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
