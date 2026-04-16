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

  // loading中は Routes を一切レンダリングしない
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
          {/* 公開ルート */}
          <Route path="/auth"           element={<Auth />} />
          <Route path="/auth/callback"  element={<AuthCallback />} />
          <Route path="/"               element={<Home />} />
          <Route path="/admin-login"    element={<AdminLogin />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* 認証必須ルート — PrivateRoute が Outlet で子を描画 */}
          <Route element={<PrivateRoute />}>
            <Route path="/body"              element={<BodyInput />} />
            <Route path="/upload-user"       element={<UploadUser />} />
            <Route path="/upload-clothes"    element={<UploadClothes />} />
            <Route path="/result"            element={<Result />} />
            <Route path="/mypage"            element={<MyPage />} />
            <Route path="/closet"            element={<Closet />} />
            <Route path="/coordinate"        element={<Coordinate />} />
            <Route path="/coordinate-result" element={<CoordinateResult />} />
          </Route>

          {/* 管理者専用ルート — AdminRoute が Outlet で子を描画 */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<Admin />} />
          </Route>
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
