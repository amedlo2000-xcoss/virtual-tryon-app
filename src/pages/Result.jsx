import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTryOn } from '../context/TryOnContext'
import { supabase } from '../supabase'

const PIAPI_KEY = 'b123fd0c2caa35b6258b8b86543fc4dace1a66a07de1da4cdff3f84001cd1d50'

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

export default function Result() {
  const navigate = useNavigate()
  const { bodyData, userImage, clothesImage } = useTryOn()
  const [tryonResult, setTryonResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const bodyLabels = {
    height: '身長', weight: '体重', bust: '胸囲',
    waist: 'ウエスト', hip: 'ヒップ', usualSize: 'サイズ',
  }

  const filledBody = Object.entries(bodyData).filter(([_, v]) => v !== '')

  const handleTryon = async () => {
    if (!userImage || !clothesImage) {
      setError('人の写真と服の画像の両方をアップロードしてください。')
      return
    }

    setLoading(true)
    setError(null)
    setTryonResult(null)

    try {
      const requestBody = {
        model: 'kling',
        task_type: 'ai_try_on',
        input: {
          model_input: userImage,
          dress_input: clothesImage,
          batch_size: 1,
        },
      }

      const response = await fetch('https://api.piapi.ai/api/v1/task', {
        method: 'POST',
        headers: {
          'x-api-key': PIAPI_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()
      const taskId = data?.data?.task_id

      if (!taskId) {
        setError(`処理の開始に失敗しました。`)
        setLoading(false)
        return
      }

      let result = null
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 5000))
        const statusRes = await fetch(`https://api.piapi.ai/api/v1/task/${taskId}`, {
          headers: { 'x-api-key': PIAPI_KEY },
        })
        const statusData = await statusRes.json()
        const status = statusData?.data?.status
        if (status === 'completed') {
          result = statusData?.data?.output?.works?.[0]?.image?.resource
          break
        } else if (status === 'failed') {
          setError('試着処理に失敗しました。')
          setLoading(false)
          return
        }
      }

      if (result) {
        setTryonResult(result)
      } else {
        setError('タイムアウトしました。もう一度お試しください。')
      }
    } catch (e) {
      setError('エラーが発生しました。')
      console.error(e)
    }

    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
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
        <p className="page-desc">ボタンを押してAI試着を開始してください。</p>
      </div>
      <div className="page-content">

        {/* アップロード画像（縦型2列） */}
        {(userImage || clothesImage) && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <div className="result-image-card">
              {userImage
                ? <img src={userImage} alt="あなたの写真" />
                : <span>写真<br />なし</span>
              }
            </div>
            <div className="result-image-card">
              {clothesImage
                ? <img src={clothesImage} alt="選んだ服" />
                : <span>服の<br />画像なし</span>
              }
            </div>
          </div>
        )}

        {/* 試着ボタン */}
        {!tryonResult && (
          <button
            className="btn-next"
            style={{ width: '100%', marginBottom: '16px' }}
            onClick={handleTryon}
            disabled={loading}
          >
            {loading ? '⏳ AI試着中...（3〜5分かかります）' : '✨ AI試着を開始する'}
          </button>
        )}

        {/* エラー */}
        {error && (
          <div className="card" style={{ background: '#fff0f0', color: '#cc0000', textAlign: 'center', fontSize: '13px' }}>
            ❌ {error}
          </div>
        )}

        {/* 試着結果（縦型） */}
        {tryonResult ? (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', textAlign: 'center' }}>
              ✅ 試着完了！
            </p>
            <div className="portrait-preview">
              <img src={tryonResult} alt="試着結果" />
            </div>
          </div>
        ) : (
          !loading && (
            <div className="result-placeholder">
              <span style={{ fontSize: '36px' }}>✨</span>
              <span>ここにAI試着結果が<br />表示されます</span>
            </div>
          )
        )}

        {/* 体型情報 */}
        {filledBody.length > 0 && (
          <div className="card">
            <strong style={{ display: 'block', marginBottom: '8px' }}>📋 入力した体型情報</strong>
            {filledBody.map(([key, val]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                <span style={{ color: '#888' }}>{bodyLabels[key]}</span>
                <span style={{ fontWeight: 600 }}>{val}{key !== 'usualSize' ? ' cm / kg' : ''}</span>
              </div>
            ))}
          </div>
        )}

        {/* 保存完了 */}
        {saved && (
          <div className="card" style={{ background: '#f0faf0', color: '#2d7a2d', textAlign: 'center' }}>
            ✅ 保存しました
          </div>
        )}

        {/* アクションボタン */}
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