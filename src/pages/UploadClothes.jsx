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

export default function UploadClothes() {
  const { clothesImage, setClothesImage } = useTryOn()
  const inputRef = useRef(null)

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const localUrl = URL.createObjectURL(file)
    setClothesImage(localUrl)
    const resized = await resizeImage(file)
    const fileName = `clothes_${Date.now()}.jpg`
    const { error } = await supabase.storage
      .from('tryon-images')
      .upload(fileName, resized, { upsert: true, contentType: 'image/jpeg' })
    if (!error) {
      const { data: urlData } = supabase.storage
        .from('tryon-images')
        .getPublicUrl(fileName)
      setClothesImage(urlData.publicUrl)
    }
  }

  return (
    <div className="page">
      <ProgressBar current={3} total={4} />

      <div className="page-header">
        <p className="step-label">Step 3 / 4</p>
        <h1 className="page-title">着せたい服の選択</h1>
        <p className="page-desc">
          縦向きの洋服画像がおすすめです。<br />
          未選択でも次へ進めます。
        </p>
      </div>

      <div className="page-content">

        {/* アップロード枠（縦型） */}
        {!clothesImage && (
          <div
            className="portrait-upload-frame"
            onClick={() => inputRef.current.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFile}
            />
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: '#F7F5F2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
            }}>
              👚
            </div>
            <div className="upload-text">
              <strong>衣服の画像を選択</strong>
              服全体が見える写真を<br />ご利用ください
            </div>
            <div style={{
              background: '#C8956C',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 700,
              padding: '10px 28px',
              borderRadius: '20px',
            }}>
              画像を選ぶ
            </div>
          </div>
        )}

        {/* プレビュー（縦型） */}
        {clothesImage && (
          <>
            <div
              className="portrait-preview"
              onClick={() => inputRef.current.click()}
              style={{ cursor: 'pointer' }}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFile}
              />
              <img src={clothesImage} alt="選択した服" />
            </div>
            <p style={{ fontSize: '12px', color: '#bbb', textAlign: 'center', marginTop: '10px' }}>
              タップして画像を変更できます
            </p>
          </>
        )}

        <div className="card" style={{ marginTop: '16px' }}>
          <strong style={{ display: 'block', marginBottom: '6px', color: '#333' }}>
            💡 画像のコツ
          </strong>
          <p style={{ fontSize: '13px', color: '#999', lineHeight: 1.8 }}>
            ・商品ページの画像でもOK<br />
            ・着用画像でも使えます<br />
            ・服全体が写っているとより正確
          </p>
        </div>

      </div>

      <NavButtons prevPath="/upload-user" nextPath="/result" nextLabel="試着する" />
    </div>
  )
}