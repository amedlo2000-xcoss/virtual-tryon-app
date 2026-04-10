import { useRef } from 'react'
import NavButtons from '../components/NavButtons'
import { useTryOn } from '../context/TryOnContext'
import { supabase } from '../supabase'

function ProgressBar({ current, total }) {
  return (
    <div className="progress-bar">
      {Array.from({ length: total }, (_, i) => {
        const s = i + 1
        return (
          <div
            key={i}
            className={`progress-step ${s < current ? 'done' : s === current ? 'active' : ''}`}
          />
        )
      })}
    </div>
  )
}

function resizeImage(file, maxSize = 1024) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let w = img.width
      let h = img.height
      if (w > maxSize || h > maxSize) {
        if (w > h) {
          h = Math.round(h * maxSize / w)
          w = maxSize
        } else {
          w = Math.round(w * maxSize / h)
          h = maxSize
        }
      }
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85)
    }
    img.src = url
  })
}

export default function UploadUser() {
  const { userImage, setUserImage } = useTryOn()
  const inputRef = useRef(null)

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const localUrl = URL.createObjectURL(file)
    setUserImage(localUrl)

    const resized = await resizeImage(file)
    const fileName = `user_${Date.now()}.jpg`
    const { error } = await supabase.storage
      .from('tryon-images')
      .upload(fileName, resized, { upsert: true, contentType: 'image/jpeg' })
    if (!error) {
      const { data: urlData } = supabase.storage
        .from('tryon-images')
        .getPublicUrl(fileName)
      setUserImage(urlData.publicUrl)
    }
  }

  return (
    <div className="page">
      <ProgressBar current={2} total={4} />
      <div className="page-header">
        <p className="step-label">Step 2 / 4</p>
        <h1 className="page-title">あなたの写真</h1>
        <p className="page-desc">
          画像があるとより自然な試着イメージになります。
          未選択でも次へ進めます。
        </p>
      </div>
      <div className="page-content">
        <div className="upload-area" onClick={() => inputRef.current.click()}>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFile}
          />
          <div className="upload-icon">📷</div>
          <div className="upload-text">
            <strong>タップして写真を選択</strong>
            全身が写った正面写真が最適です
          </div>
        </div>
        {userImage && (
          <div className="image-preview">
            <img src={userImage} alt="あなたの写真" />
          </div>
        )}
        <div className="card" style={{ marginTop: '20px' }}>
          撮影のコツ：全身が映るように撮影する。
          白・グレーの無地壁を背景にする。
          ぴったりした服装で撮ると精度が上がる。
        </div>
      </div>
      <NavButtons prevPath="/body" nextPath="/upload-clothes" />
    </div>
  )
}