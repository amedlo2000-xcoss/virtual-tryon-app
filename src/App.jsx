import { Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import { TryOnContext } from './context/TryOnContext'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'

import Auth          from './pages/Auth'
import Home          from './pages/Home'
import BodyInput     from './pages/BodyInput'
import UploadUser    from './pages/UploadUser'
import UploadClothes from './pages/UploadClothes'
import Result        from './pages/Result'
import MyPage        from './pages/MyPage'

export default function App() {
  const [bodyData, setBodyData] = useState({
    height: '', weight: '', bust: '', waist: '', hip: '', usualSize: ''
  })
  const [userImage, setUserImage]       = useState(null)
  const [clothesImage, setClothesImage] = useState(null)

  return (
    <AuthProvider>
      <TryOnContext.Provider value={{
        bodyData, setBodyData,
        userImage, setUserImage,
        clothesImage, setClothesImage,
      }}>
        <div className="app-container">
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/"    element={<Home />} />
            <Route path="/body"           element={<PrivateRoute><BodyInput /></PrivateRoute>} />
            <Route path="/upload-user"    element={<PrivateRoute><UploadUser /></PrivateRoute>} />
            <Route path="/upload-clothes" element={<PrivateRoute><UploadClothes /></PrivateRoute>} />
            <Route path="/result"         element={<PrivateRoute><Result /></PrivateRoute>} />
            <Route path="/mypage"         element={<PrivateRoute><MyPage /></PrivateRoute>} />
          </Routes>
        </div>
      </TryOnContext.Provider>
    </AuthProvider>
  )
}
