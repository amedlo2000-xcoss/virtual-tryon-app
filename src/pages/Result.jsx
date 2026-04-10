import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTryOn } from '../context/TryOnContext'
import { supabase } from '../supabase'

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

export default function Result() {
  const navigate = useNavigate()
  const { bodyData, userImage, clothesImage } = useTryOn()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const bodyLabels = {
    height: '身長', weight: '体重', bust: '胸囲',
    waist: 'ウエスト', hip: 'ヒップ', usualSize: 'サイズ',
  }

  const filledBody = Object.entries(bodyData).filter(([_, v]) => v !== '')

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    const { error } = await supabase
      .from('tryon_sessions')
      .insert([{
        height: bodyData.height || null,
        weight: bodyData.weight || null,
        bust: bodyData.bust || null,
        waist: bodyData.waist || null,
        hip: bodyData.hip || null,
        usual_size: bodyData.usualSize || null,
        user_image_url: userImage || null,
        clothes_image_url: clothesImage || null,
      }])
    setSaving(false)
    if (error) {
      setSaveError('保存に失敗しました。')
      console.error(error)
    } else {
      setSaved(true)
    }
  }

  return (
    <div className="page">
      <ProgressBar current={4} total={4} />
      <div className="page-header">
        <p className="step-label">Step 4 / 4</p>
        <h1 className="page-title">試着結果</h1>
        <p className="page-desc">下のAIツールに画像をアップロードして試着できます。</p>
      </div>
      <div className="page-content">
        {(userImage || clothesImage) && (
          <div className="card" style={{ marginBottom: '16px' }}>
            <strong style={{ display: 'block', marginBottom: '8px' }}>アップロードした画像</strong>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <p style={{ fontSize: '11px', color: '#aaa', marginBottom: '6px' }}>あなたの写真</p>
                {userImage
                  ? <img src={userImage} alt="あなたの写真" style={{ width: '100%', borderRadius: '8px', maxHeight: '120px', objectFit: 'cover' }} />
                  : <div style={{ height: '80px', background: '#f2f2f2', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#ccc' }}>なし</div>
                }
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <p style={{ fontSize: '11px', color: '#aaa', marginBottom: '6px' }}>選んだ服</p>
                {clothesImage
                  ? <img src={clothesImage} alt="選んだ服" style={{ width: '100%', borderRadius: '8px', maxHeight: '120px', objectFit: 'cover' }} />
                  : <div style={{ height: '80px', background: '#f2f2f2', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#ccc' }}>なし</div>
                }
              </div>
            </div>
          </div>
        )}
        <div className="card">
          <strong style={{ display: 'block', marginBottom: '8px' }}>AI試着の使い方</strong>
          左側「Human」にあなたの写真をアップロード<br />
          右側「Garment」に服の画像をアップロード<br />
          下の「Run」ボタンをクリック<br />
          2〜3分待つと試着結果が表示されます
        </div>
        <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1.5px solid #e8e8e8', marginBottom: '20px' }}>
          <iframe
            src="https://yisol-idm-vton.hf.space"
            width="100%"
            height="600px"
            style={{ border: 'none', display: 'block' }}
            title="IDM-VTON AI試着"
            allow="camera;microphone"
          />
        </div>
        {filledBody.length > 0 && (
          <div className="card">
            <strong style={{ display: 'block', marginBottom: '8px' }}>入力した体型情報</strong>
            {filledBody.map(([key, val]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                <span style={{ color: '#888' }}>{bodyLabels[key]}</span>
                <span style={{ fontWeight: 600 }}>{val}{key !== 'usualSize' ? ' cm / kg' : ''}</span>
              </div>
            ))}
          </div>
        )}
        {saved && (
          <div className="card" style={{ background: '#f0faf0', color: '#2d7a2d', textAlign: 'center' }}>
            保存しました
          </div>
        )}
        {saveError && (
          <div className="card" style={{ background: '#fff0f0', color: '#cc0000', textAlign: 'center' }}>
            {saveError}
          </div>
        )}
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button className="btn-back" onClick={handleSave} disabled={saving || saved}>
            {saving ? '保存中...' : saved ? '保存済み' : '保存する'}
          </button>
          <button className="btn-next" onClick={() => navigate('/')}>
            もう一度試す
          </button>
        </div>
      </div>
      <div className="button-row">
        <button className="btn-back" onClick={() => navigate('/upload-clothes')}>
          戻る
        </button>
      </div>
    </div>
  )
}