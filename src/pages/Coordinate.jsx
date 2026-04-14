import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTryOn } from '../context/TryOnContext'
import NavButtons from '../components/NavButtons'

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
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}

export default function Coordinate() {
  const { selectedClosetItem, setCombinedOutfit } = useTryOn()
  const [newClothesImage, setNewClothesImage] = useState(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const resized = await resizeImage(file)
    const url = URL.createObjectURL(resized)
    setNewClothesImage(url)
    e.target.value = ''
  }

  const handleTryOn = () => {
    setCombinedOutfit({
      closetItem: selectedClosetItem,
      newClothes: newClothesImage,
    })
    navigate('/coordinate-result')
  }

  const canProceed = selectedClosetItem || newClothesImage

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">コーデを作る</h1>
        <p className="page-desc">2枚の服を組み合わせて試着しましょう</p>
      </div>

      <div className="page-content">
        <div className="coordinate-preview">
          {/* 左: クローゼットから選択した服 */}
          <div className="coordinate-slot">
            <p className="coordinate-slot__label">クローゼットから</p>
            {selectedClosetItem ? (
              <div
                className="coordinate-slot__image"
                onClick={() => navigate('/closet')}
                style={{ cursor: 'pointer' }}
              >
                <img src={selectedClosetItem.image_url} alt={selectedClosetItem.name} />
              </div>
            ) : (
              <div
                className="coordinate-slot__empty"
                onClick={() => navigate('/closet')}
              >
                <span>👚</span>
                <p>クローゼットから選択</p>
              </div>
            )}
          </div>

          {/* 右: 新しい服をアップロード */}
          <div className="coordinate-slot">
            <p className="coordinate-slot__label">新しい服</p>
            {newClothesImage ? (
              <div
                className="coordinate-slot__image"
                onClick={() => inputRef.current.click()}
                style={{ cursor: 'pointer' }}
              >
                <img src={newClothesImage} alt="新しい服" />
              </div>
            ) : (
              <div
                className="coordinate-slot__empty"
                onClick={() => inputRef.current.click()}
              >
                <span>📷</span>
                <p>タップして追加</p>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </div>
        </div>

        <button
          className="btn-primary"
          style={{ marginTop: '24px' }}
          onClick={handleTryOn}
          disabled={!canProceed}
        >
          この組み合わせで試着する
        </button>
      </div>

      <NavButtons prevPath="/closet" />
    </div>
  )
}
