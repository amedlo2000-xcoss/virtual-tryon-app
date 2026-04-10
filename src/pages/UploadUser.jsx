import { useRef } from 'react'
import NavButtons from '../components/NavButtons'
import { useTryOn } from '../context/TryOnContext'

function ProgressBar({ current, total }) {
  return (
    <div className="progress-bar">
      {Array.from({ length: total }, (_, i) => {
        const s = i + 1
        return <div key={i} className={`progress-step ${s < current ? 'done' : s === current ? 'active' : ''}`} />
      })}
    </div>
  )
}

export default function UploadUser() {
  const { userImage, setUserImage } = useTryOn()
  const inputRef = useRef(null)

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setUserImage(url)
  }

  return (
    <div className="page">
      <ProgressBar current={2} total={4} />
      <div className="page-header">
        <p className="step-label">Step 2 / 4</p>
        <h1 className="page-title">あなたの写真</h1>
        <p className="page-desc">
          画像があるとより自然な試着イメージになります。<br />
          未選択でも次へ進めます。
        </p>
      </div>
      <div className="page-content">
        <div className="upload-area" onClick={() => inputRef.current.click()}>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            style={{ display:'none' }}
            onChange={handleFile}
          />
          <div className="upload-icon">📷</div>
          <div className="upload-text">
            <strong>タップして写真を選択</strong><br />
            全身が写った正面写真が最適です
          </div>
        </div>
        {userImage && (
          <div className="image-preview">
            <img src={userImage} alt="あなたの写真" />
          </div>
        )}
        <div className="card" style={{ marginTop:'20px' }}>
          <strong>📌 撮影のコツ</strong><br />
          ・全身が映るように撮影する<br />
          ・白・グレーの無地壁を背景にする<br />
          ・ぴったりした服装で撮ると精度が上がる
        </div>
      </div>
      <NavButtons prevPath="/body" nextPath="/upload-clothes" />
    </div>
  )
}