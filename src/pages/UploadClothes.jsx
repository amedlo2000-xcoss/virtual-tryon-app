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

export default function UploadClothes() {
  const { clothesImage, setClothesImage } = useTryOn()
  const inputRef = useRef(null)

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setClothesImage(url)
  }

  return (
    <div className="page">
      <ProgressBar current={3} total={4} />
      <div className="page-header">
        <p className="step-label">Step 3 / 4</p>
        <h1 className="page-title">着せたい服の選択</h1>
        <p className="page-desc">
          洋服画像があると試着結果の再現性が上がります。<br />
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
          <div className="upload-icon">👚</div>
          <div className="upload-text">
            <strong>衣服の画像を選択</strong><br />
            正面の商品画像が最適です
          </div>
        </div>
        {clothesImage && (
          <div className="image-preview">
            <img src={clothesImage} alt="選択した服" />
          </div>
        )}
        <div className="card" style={{ marginTop:'20px' }}>
          💡 商品ページの画像や、着用画像でもOKです
        </div>
      </div>
      <NavButtons prevPath="/upload-user" nextPath="/result" nextLabel="試着する" />
    </div>
  )
}