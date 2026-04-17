import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useTryOn } from '../context/TryOnContext'
import { useAuth } from '../context/AuthContext'
import ClosetCard from '../components/ClosetCard'
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

export default function Closet() {
  const { closetItems, setClosetItems, selectedClosetItem, setSelectedClosetItem } = useTryOn()
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pendingFile, setPendingFile] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0])
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [filterCat, setFilterCat] = useState('すべて')
  const inputRef = useRef(null)
  const navigate = useNavigate()

  const filterTabs = ['すべて', ...CATEGORIES.map(c => c.label)]

  useEffect(() => {
    if (!user) return
    loadClosetItems()
  }, [user])

  const loadClosetItems = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('closet_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (!error && data) setClosetItems(data)
    setLoading(false)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file || !user) return
    setPendingFile(file)
    setSelectedCategory(CATEGORIES[0])
    setShowCategoryModal(true)
    e.target.value = ''
  }

  const handleConfirmUpload = async () => {
    if (!pendingFile || !user) return
    setShowCategoryModal(false)
    setUploading(true)
    try {
      const resized = await resizeImage(pendingFile)
      const fileName = `closet_${user.id}_${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('tryon-images')
        .upload(fileName, resized, { upsert: true, contentType: 'image/jpeg' })
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage
        .from('tryon-images')
        .getPublicUrl(fileName)
      const name = pendingFile.name.replace(/\.[^.]+$/, '') || `アイテム${closetItems.length + 1}`
      const { data: insertData, error: insertError } = await supabase
        .from('closet_items')
        .insert({
          user_id: user.id,
          image_url: urlData.publicUrl,
          name,
          category: selectedCategory.label,
          fashn_category: selectedCategory.fashn,
        })
        .select()
        .single()
      if (insertError) throw insertError
      setClosetItems(prev => [insertData, ...prev])
    } catch (err) {
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
      setPendingFile(null)
    }
  }

  const handleDelete = async (item) => {
    const { error } = await supabase
      .from('closet_items')
      .delete()
      .eq('id', item.id)
    if (!error) {
      setClosetItems(prev => prev.filter(i => i.id !== item.id))
      if (selectedClosetItem?.id === item.id) setSelectedClosetItem(null)
    }
  }

  const filteredItems = filterCat === 'すべて'
    ? closetItems
    : closetItems.filter(item => item.category === filterCat)

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">クローゼット</h1>
        <p className="page-desc">服を登録してコーデを試着しましょう</p>
      </div>

      <div className="page-content">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* カテゴリフィルタータブ */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
          marginBottom: '16px',
          scrollbarWidth: 'none',
        }}>
          {filterTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setFilterCat(tab)}
              style={{
                padding: '7px 16px',
                borderRadius: '20px',
                border: filterCat === tab ? 'none' : '1.5px solid #F0E8E8',
                background: filterCat === tab ? '#E8A0A8' : '#FFFFFF',
                color: filterCat === tab ? '#FFFFFF' : '#888888',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.15s',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#bbb', padding: '40px 0' }}>
            読み込み中...
          </div>
        ) : closetItems.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#bbb', padding: '40px 0', fontSize: '14px', lineHeight: 2 }}>
            まだ服が登録されていません<br />右下の + ボタンから追加してください
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#bbb', padding: '40px 0', fontSize: '14px', lineHeight: 2 }}>
            このカテゴリの服がありません
          </div>
        ) : (
          <div className="closet-grid">
            {filteredItems.map(item => (
              <ClosetCard
                key={item.id}
                item={item}
                isSelected={selectedClosetItem?.id === item.id}
                onSelect={() => {
                  setSelectedClosetItem(item)
                  navigate('/coordinate')
                }}
                onDelete={() => handleDelete(item)}
              />
            ))}
          </div>
        )}

        <button
          className="btn-primary"
          style={{ marginTop: '20px' }}
          onClick={() => navigate('/coordinate')}
        >
          コーデを作る →
        </button>
      </div>

      <NavButtons />

      {/* FAB：服を追加する */}
      <button
        onClick={() => inputRef.current.click()}
        disabled={uploading}
        style={{
          position: 'fixed',
          bottom: '88px',
          right: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: uploading ? '#F0C4C8' : '#E8A0A8',
          color: '#FFFFFF',
          border: 'none',
          fontSize: '28px',
          fontWeight: 700,
          cursor: uploading ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 16px rgba(232,160,168,0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          transition: 'background 0.2s',
          flex: 'none',
          lineHeight: 1,
        }}
        title="服を追加する"
      >
        {uploading ? '…' : '+'}
      </button>

      {/* カテゴリ選択モーダル */}
      {showCategoryModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => { setShowCategoryModal(false); setPendingFile(null) }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '20px 20px 0 0',
              padding: '28px 20px 40px',
              width: '100%',
              maxWidth: '480px',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#333',
              marginBottom: '6px',
              textAlign: 'center',
            }}>
              カテゴリを選択
            </h3>
            <p style={{
              fontSize: '12px',
              color: '#999',
              textAlign: 'center',
              marginBottom: '20px',
            }}>
              服の種類を選んでください
            </p>

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '24px',
              justifyContent: 'center',
            }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.label}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '20px',
                    border: selectedCategory?.label === cat.label ? 'none' : '1px solid #ddd',
                    background: selectedCategory?.label === cat.label ? '#E8A0A8' : '#FAF5F0',
                    color: selectedCategory?.label === cat.label ? '#FFFFFF' : '#333333',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <button
              className="btn-primary"
              onClick={handleConfirmUpload}
            >
              この服を追加する
            </button>
            <button
              style={{
                width: '100%',
                marginTop: '10px',
                padding: '12px',
                background: 'transparent',
                border: 'none',
                color: '#999',
                fontSize: '13px',
                cursor: 'pointer',
              }}
              onClick={() => { setShowCategoryModal(false); setPendingFile(null) }}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
