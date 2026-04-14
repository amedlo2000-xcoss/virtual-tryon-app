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

  /* selectedClosetItem が未選択の場合 */
  if (!selectedClosetItem) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">コーデを作る</h1>
          <p className="page-desc">2枚の服を組み合わせて試着しましょう</p>
        </div>

        <div
          className="page-content"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            paddingTop: '40px',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '36px 24px',
              textAlign: 'center',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              width: '100%',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👗</div>
            <p style={{ fontSize: '15px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
              クローゼットから服を選んでください
            </p>
            <p style={{ fontSize: '13px', color: '#999', lineHeight: 1.7 }}>
              コーデを作るには、まずクローゼットから<br />ベースとなる服を選択してください
            </p>
          </div>

          <button
            className="btn-primary"
            onClick={() => navigate('/closet')}
          >
            クローゼットから服を選ぶ
          </button>
        </div>

        <NavButtons prevPath="/closet" />
      </div>
    )
  }

  /* selectedClosetItem が選択済みの場合 */
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">コーデを作る</h1>
        <p className="page-desc">2枚の服を組み合わせて試着しましょう</p>
      </div>

      <div className="page-content">
        {/* 左右レイアウト */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>

          {/* 左: クローゼットから選択した服 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <p style={{
              fontSize: '11px',
              fontWeight: '600',
              color: '#999',
              textAlign: 'center',
              marginBottom: '6px',
              letterSpacing: '0.03em',
            }}>
              クローゼットから
            </p>
            <div
              style={{
                width: '100%',
                aspectRatio: '3 / 4',
                borderRadius: '20px',
                overflow: 'hidden',
                background: '#FFFFFF',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                border: '2px solid #C8956C',
                cursor: 'pointer',
              }}
              onClick={() => navigate('/closet')}
              title="クローゼットに戻って変更"
            >
              <img
                src={selectedClosetItem.image_url}
                alt={selectedClosetItem.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                  display: 'block',
                }}
              />
            </div>
            <p style={{
              fontSize: '11px',
              color: '#C8956C',
              textAlign: 'center',
              marginTop: '6px',
              fontWeight: '600',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {selectedClosetItem.name}
            </p>
          </div>

          {/* 右: 新しい服をアップロード */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <p style={{
              fontSize: '11px',
              fontWeight: '600',
              color: '#999',
              textAlign: 'center',
              marginBottom: '6px',
              letterSpacing: '0.03em',
            }}>
              新しい服
            </p>
            {newClothesImage ? (
              <div
                style={{
                  width: '100%',
                  aspectRatio: '3 / 4',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  background: '#FFFFFF',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                }}
                onClick={() => inputRef.current.click()}
              >
                <img
                  src={newClothesImage}
                  alt="新しい服"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center top',
                    display: 'block',
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: '100%',
                  aspectRatio: '3 / 4',
                  border: '2px dashed #E6B89C',
                  borderRadius: '20px',
                  background: '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
                onClick={() => inputRef.current.click()}
              >
                <span style={{ fontSize: '28px', lineHeight: 1 }}>📷</span>
                <p style={{ fontSize: '11px', color: '#bbb', textAlign: 'center', lineHeight: 1.5 }}>
                  タップして追加
                </p>
              </div>
            )}
            <p style={{
              fontSize: '11px',
              color: '#bbb',
              textAlign: 'center',
              marginTop: '6px',
            }}>
              {newClothesImage ? 'タップで変更' : '画像をアップロード'}
            </p>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />

        <button
          className="btn-primary"
          onClick={handleTryOn}
          disabled={!newClothesImage}
          style={{ opacity: newClothesImage ? 1 : 0.45 }}
        >
          この組み合わせで試着する
        </button>

        {!newClothesImage && (
          <p style={{
            textAlign: 'center',
            fontSize: '12px',
            color: '#bbb',
            marginTop: '10px',
          }}>
            右側に新しい服をアップロードしてください
          </p>
        )}
      </div>

      <NavButtons prevPath="/closet" />
    </div>
  )
}
