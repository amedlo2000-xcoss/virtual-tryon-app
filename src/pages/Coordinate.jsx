import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useTryOn } from '../context/TryOnContext'
import NavButtons from '../components/NavButtons'

const CATEGORIES = [
  { label: 'トップス', fashn: 'tops' },
  { label: 'アウター', fashn: 'tops' },
  { label: 'ボトムス', fashn: 'bottoms' },
  { label: 'スカート', fashn: 'bottoms' },
  { label: 'ワンピース', fashn: 'one-pieces' },
  { label: 'オールインワン', fashn: 'one-pieces' },
  { label: 'セットアップ', fashn: 'one-pieces' },
]

const BADGE_COLORS = {
  tops: { bg: '#EBF4FF', color: '#2D6EA6' },
  bottoms: { bg: '#F0EBFF', color: '#6B42C8' },
  'one-pieces': { bg: '#FFF0EB', color: '#C85A28' },
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
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}

function CategoryBadge({ fashnCategory, label }) {
  const badge = BADGE_COLORS[fashnCategory]
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '20px',
      fontSize: '10px',
      fontWeight: 700,
      background: badge?.bg || '#F0F0F0',
      color: badge?.color || '#666',
      lineHeight: 1.6,
    }}>
      {label}
    </span>
  )
}

export default function Coordinate() {
  const { selectedClosetItem, setCombinedOutfit } = useTryOn()
  const [newClothesImage, setNewClothesImage] = useState(null)
  const [selectedNewCategory, setSelectedNewCategory] = useState(CATEGORIES[0])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)
    try {
      const resized = await resizeImage(file)
      const localUrl = URL.createObjectURL(resized)
      setNewClothesImage(localUrl)
      const fileName = `coordinate_${Date.now()}.jpg`
      const { error } = await supabase.storage
        .from('tryon-images')
        .upload(fileName, resized, { upsert: true, contentType: 'image/jpeg' })
      if (error) throw error
      const { data: urlData } = supabase.storage
        .from('tryon-images')
        .getPublicUrl(fileName)
      console.log('[Coordinate] 新しい服のSupabase公開URL:', urlData.publicUrl)
      setNewClothesImage(urlData.publicUrl)
    } catch (err) {
      console.error('[Coordinate] 服のアップロードエラー:', err)
      setNewClothesImage(null)
      setUploadError('アップロードに失敗しました。もう一度お試しください。')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleTryOn = () => {
    setCombinedOutfit({
      closetImage: selectedClosetItem.image_url,
      closetFashnCategory: selectedClosetItem.fashn_category || 'tops',
      newClothesImage,
      newClothesFashnCategory: selectedNewCategory.fashn,
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
        {/* ステップ説明 */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          padding: '14px 16px',
          marginBottom: '16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          display: 'flex',
          gap: '12px',
        }}>
          {[
            { step: '01', label: 'クローゼットの服', sub: '選択済み' },
            { step: '02', label: '新しい服', sub: '画像をアップ' },
          ].map(s => (
            <div key={s.step} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '10px',
                background: '#FAF5F0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#E8A0A8' }}>{s.step}</span>
              </div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#333', margin: 0 }}>{s.label}</p>
                <p style={{ fontSize: '11px', color: '#999', margin: 0 }}>{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 左右レイアウト */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>

          {/* 左: クローゼットから選択した服 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
                border: '2px solid #E8A0A8',
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
              color: '#E8A0A8',
              textAlign: 'center',
              marginTop: '6px',
              fontWeight: '600',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%',
            }}>
              {selectedClosetItem.name}
            </p>
            {selectedClosetItem.category && selectedClosetItem.fashn_category && (
              <div style={{ marginTop: '4px' }}>
                <CategoryBadge
                  fashnCategory={selectedClosetItem.fashn_category}
                  label={selectedClosetItem.category}
                />
              </div>
            )}
          </div>

          {/* 右: 新しい服をアップロード */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
                  border: '2px dashed #F5E6E8',
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

        {/* 新しい服のカテゴリ選択 */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          padding: '14px 16px',
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#666', marginBottom: '10px' }}>
            新しい服のカテゴリ
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.label}
                onClick={() => setSelectedNewCategory(cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: selectedNewCategory?.label === cat.label ? 'none' : '1px solid #ddd',
                  background: selectedNewCategory?.label === cat.label ? '#E8A0A8' : '#FAF5F0',
                  color: selectedNewCategory?.label === cat.label ? '#FFFFFF' : '#333333',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />

        {uploadError && (
          <div className="card" style={{ background: '#FFF5F5', color: '#cc0000', textAlign: 'center', fontSize: '13px', marginBottom: '12px' }}>
            {uploadError}
          </div>
        )}

        <button
          className="btn-primary"
          onClick={handleTryOn}
          disabled={!newClothesImage || uploading}
          style={{ opacity: (newClothesImage && !uploading) ? 1 : 0.45 }}
        >
          {uploading ? 'アップロード中...' : 'この組み合わせで試着する'}
        </button>

        {!newClothesImage && !uploading && (
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
