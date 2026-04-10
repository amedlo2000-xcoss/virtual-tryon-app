import { Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import { TryOnContext } from './context/TryOnContext'

import Home          from './pages/Home'
import BodyInput     from './pages/BodyInput'
import UploadUser    from './pages/UploadUser'
import UploadClothes from './pages/UploadClothes'
import Result        from './pages/Result'

export default function App() {
  const [bodyData, setBodyData] = useState({
    height: '', weight: '', bust: '', waist: '', hip: '', usualSize: ''
  })
  const [userImage, setUserImage]       = useState(null)
  const [clothesImage, setClothesImage] = useState(null)

  return (
    <TryOnContext.Provider value={{
      bodyData, setBodyData,
      userImage, setUserImage,
      clothesImage, setClothesImage,
    }}>
      <div className="app-container">
        <Routes>
          <Route path="/"               element={<Home />} />
          <Route path="/body"           element={<BodyInput />} />
          <Route path="/upload-user"    element={<UploadUser />} />
          <Route path="/upload-clothes" element={<UploadClothes />} />
          <Route path="/result"         element={<Result />} />
        </Routes>
      </div>
    </TryOnContext.Provider>
  )
}