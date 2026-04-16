import { Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import { TryOnContext } from './context/TryOnContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import AdminRoute   from './components/AdminRoute'

import Auth             from './pages/Auth'
import AuthCallback      from './pages/AuthCallback'
import Home              from './pages/Home'
import BodyInput         from './pages/BodyInput'
import UploadUser        from './pages/UploadUser'
import UploadClothes     from './pages/UploadClothes'
import Result            from './pages/Result'
import MyPage            from './pages/MyPage'
import Closet            from './pages/Closet'
import Coordinate        from './pages/Coordinate'
import CoordinateResult  from './pages/CoordinateResult'
import AdminLogin        from './pages/AdminLogin'
import Admin             from './pages/Admin'
import ResetPassword     from './pages/ResetPassword'

function GlobalSpinner() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F7F5F2',
      zIndex: 9999,
    }}>
      <div style={{
        width: '44px',
        height: '44px',
        border: '4px solid #E8DDD5',
        borderTop: '4px solid #C8956C',
        borderRadius: '50%',
        animation: 'auth-spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes auth-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function AppContent() {
  const { loading } = useAuth()
  const [bodyData, setBodyData] = useState({
    height: '', weight: '', bust: '', waist: '', hip: '', usualSize: ''
  })
  const [userImage, setUserImage]                     = useState(null)
  const [clothesImage, setClothesImage]               = useState(null)
  const [closetItems, setClosetItems]                 = useState([])
  const [selectedClosetItem, setSelectedClosetItem]   = useState(null)
  const [combinedOutfit, setCombinedOutfit]           = useState(null)

  if (loading) return <GlobalSpinner />

  return (
    <TryOnContext.Provider value={{
      bodyData, setBodyData,
      userImage, setUserImage,
      clothesImage, setClothesImage,
      closetItems, setClosetItems,
      selectedClosetItem, setSelectedClosetItem,
      combinedOutfit, setCombinedOutfit,
    }}>
      <div className="app-container">
        <Routes>
          <Route path="/auth"          element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/"              element={<Home />} />
          <Route path="/body"           element={<PrivateRoute><BodyInput /></PrivateRoute>} />
          <Route path="/upload-user"    element={<PrivateRoute><UploadUser /></PrivateRoute>} />
          <Route path="/upload-clothes" element={<PrivateRoute><UploadClothes /></PrivateRoute>} />
          <Route path="/result"              element={<PrivateRoute><Result /></PrivateRoute>} />
          <Route path="/mypage"             element={<PrivateRoute><MyPage /></PrivateRoute>} />
          <Route path="/closet"             element={<PrivateRoute><Closet /></PrivateRoute>} />
          <Route path="/coordinate"         element={<PrivateRoute><Coordinate /></PrivateRoute>} />
          <Route path="/coordinate-result"  element={<PrivateRoute><CoordinateResult /></PrivateRoute>} />
          <Route path="/admin-login"        element={<AdminLogin />} />
          <Route path="/admin"              element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/reset-password"     element={<ResetPassword />} />
        </Routes>
      </div>
    </TryOnContext.Provider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
