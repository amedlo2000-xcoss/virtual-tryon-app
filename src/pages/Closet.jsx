import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useTryOn } from '../context/TryOnContext'
import { useAuth } from '../context/AuthContext'
import ClosetCard from '../components/ClosetCard'
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

export default function Closet() {
  const { closetItems, setClosetItems, selectedClosetItem, setSelectedClosetItem } = useTryOn()
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const inputRef = useRef(null)
  const navigate = useNavigate()

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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file || !user) return
    setUploading(true)
    try {
      const resized = await resizeImage(file)
      const fileName = `closet_${user.id}_${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('tryon-images')
        .upload(fileName, resized, { upsert: true, contentType: 'image/jpeg' })
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage
        .from('tryon-images')
        .getPublicUrl(fileName)
      const name = file.name.replace(/\.[^.]+$/, '') || `アイテム${closetItems.length + 1}`
      const { data: insertData, error: insertError } = await supabase
        .from('closet_items')
        .insert({ user_id: user.id, image_url: urlData.publicUrl, name })
        .select()
        .single()
      if (insertError) throw insertError
      setClosetItems(prev => [insertData, ...prev])
    } catch (err) {
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
      e.target.value = ''
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

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">クローゼット</h1>
        <p className="page-desc">服を登録してコーデを試着しましょう</p>
      </div>

      <div className="page-content">
        <button
          className="btn-primary"
          style={{ marginBottom: '16px' }}
          onClick={() => inputRef.current.click()}
          disabled={uploading}
        >
          {uploading ? 'アップロード中...' : '+ 服を追加する'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />

        {loading ? (
          <div style={{ textAlign: 'center', color: '#bbb', padding: '40px 0' }}>
            読み込み中...
          </div>
        ) : closetItems.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#bbb', padding: '40px 0', fontSize: '14px', lineHeight: 2 }}>
            まだ服が登録されていません<br />上のボタンから追加してください
          </div>
        ) : (
          <div className="closet-grid">
            {closetItems.map(item => (
              <ClosetCard
                key={item.id}
                item={item}
                isSelected={selectedClosetItem?.id === item.id}
                onSelect={() => setSelectedClosetItem(
                  selectedClosetItem?.id === item.id ? null : item
                )}
                onDelete={() => handleDelete(item)}
              />
            ))}
          </div>
        )}

        {closetItems.length > 0 && (
          <button
            className="btn-primary"
            style={{ marginTop: '20px' }}
            onClick={() => navigate('/coordinate')}
          >
            コーデを作る →
          </button>
        )}
      </div>

      <NavButtons />
    </div>
  )
}
