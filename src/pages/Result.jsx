import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTryOn } from '../context/TryOnContext'
import ShareButton from '../components/ShareButton'

// const PIAPI_KEY = 'b123fd0c2caa35b6258b8b86543fc4dace1a66a07de1da4cdff3f84001cd1d50'

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
  const [progress, setProgress] = useState(0)
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
    setProgress(0)

    try {
      // ---- PiAPI（旧） ----
      // const response = await fetch('https://api.piapi.ai/api/v1/task', {
      //   method: 'POST',
      //   headers: {
      //     'x-api-key': PIAPI_KEY,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     model: 'kling',
      //     task_type: 'ai_try_on',
      //     input: {
      //       model_input: userImage,
      //       dress_input: clothesImage,
      //       batch_size: 1,
      //     },
      //   }),
      // })
      // const data = await response.json()
      // const taskId = data?.data?.task_id

      // ---- FASHN V1.6 ----
      const fashnResponse = await fetch('https://api.fashn.ai/v1/run', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_FASHN_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model_name: 'tryon-v1.6',
          inputs: {
            model_image: userImage,
            garment_image: clothesImage,
            category: 'auto',
          },
        }),
      })

      const fashnData = await fashnResponse.json()
      const taskId = fashnData?.id

      if (!taskId) {
        const errMsg = fashnData?.message || fashnData?.error || JSON.stringify(fashnData)
        setError(`処理の開始に失敗しました：${errMsg}`)
        setLoading(false)
        return
      }

      let result = null
      const MAX_POLLS = 100
      for (let i = 0; i < MAX_POLLS; i++) {
        await new Promise(r => setTimeout(r, 3000))
        setProgress(Math.min(Math.round(((i + 1) / MAX_POLLS) * 100), 99))
        const statusRes = await fetch(`https://api.fashn.ai/v1/status/${taskId}`, {
          headers: { 'Authorization': `Bearer ${import.meta.env.VITE_FASHN_API_KEY}` },
        })
        const statusData = await statusRes.json()
        const status = statusData?.status
        if (status === 'completed') {
          result = statusData?.output?.[0]
          setProgress(100)
          break
        } else if (status === 'failed') {
          const errMsg = statusData?.error?.message || statusData?.error || '不明なエラー'
          setError(`試着処理に失敗しました：${errMsg}`)
          setLoading(false)
          return
        }
      }

      if (result) {
        setTryonResult(result)
      } else {
        setError('時間がかかっています。もう一度お試しください。')
      }
    } catch (e) {
      setError('エラーが発生しました。')
      console.error(e)
    }
    setLoading(false)
  }

  return (
    <div className="page">
      <ProgressBar current={4} total={4} />

      <div className="page-header">
        <p className="step-label">Step 4 / 4</p>
        <h1 className="page-title">試着結果</h1>
        <p className="page-desc">AIが試着画像を生成します。</p>
      </div>

      <div className="page-content">

        {/* アップロード画像（縦型2列） */}
        {(userImage || clothesImage) && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '11px', color: '#bbb', textAlign: 'center', marginBottom: '6px', fontWeight: 600 }}>
                あなたの写真
              </p>
              <div className="result-image-card">
                {userImage
                  ? <img src={userImage} alt="あなたの写真" />
                  : <span>写真<br />なし</span>
                }
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '11px', color: '#bbb', textAlign: 'center', marginBottom: '6px', fontWeight: 600 }}>
                選んだ服
              </p>
              <div className="result-image-card">
                {clothesImage
                  ? <img src={clothesImage} alt="選んだ服" />
                  : <span>服の<br />画像なし</span>
                }
              </div>
            </div>
          </div>
        )}

        {/* 試着ボタン */}
        {!tryonResult && (
          <button
            className="btn-next"
            style={{ width: '100%', marginBottom: '16px', fontSize: '16px', height: '58px' }}
            onClick={handleTryon}
            disabled={loading}
          >
            {loading ? '⏳ AI試着中...（3〜5分）' : '✨ AI試着を開始する'}
          </button>
        )}

        {/* エラー */}
        {error && (
          <div className="card" style={{ background: '#FFF5F5', color: '#cc0000', textAlign: 'center', fontSize: '13px' }}>
            ❌ {error}
          </div>
        )}

        {/* ローディング進捗バー */}
        {loading && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: '#aaa' }}>AI処理中...</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#C8956C' }}>{progress}%</span>
            </div>
            <div style={{ background: '#2a2a2a', borderRadius: '8px', height: '10px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #C8956C, #e8b48c)',
                  borderRadius: '8px',
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
            <p style={{ fontSize: '11px', color: '#888', textAlign: 'center', marginTop: '8px' }}>
              完了まで3〜5分かかります
            </p>
          </div>
        )}

        {/* 試着結果（縦型） */}
        {tryonResult ? (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', textAlign: 'center', color: '#C8956C' }}>
              ✅ 試着完了！
            </p>
            <div className="portrait-preview">
              <img src={tryonResult} alt="試着結果" />
            </div>
            <ShareButton imageUrl={tryonResult} />
          </div>
        ) : (
          !loading && (
            <div className="result-placeholder">
              <span style={{ fontSize: '48px' }}>✨</span>
              <span style={{ color: '#ccc', fontSize: '14px', lineHeight: 1.7 }}>
                ここにAI試着結果が<br />表示されます
              </span>
            </div>
          )
        )}

        {/* 体型情報 */}
        {filledBody.length > 0 && (
          <div className="card">
            <strong style={{ display: 'block', marginBottom: '10px', color: '#333' }}>
              📋 入力した体型情報
            </strong>
            {filledBody.map(([key, val]) => (
              <div key={key} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: '1px solid #F0EBE4',
                fontSize: '14px',
              }}>
                <span style={{ color: '#999' }}>{bodyLabels[key]}</span>
                <span style={{ fontWeight: 700, color: '#333' }}>
                  {val}{key !== 'usualSize' ? ' cm / kg' : ''}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* アクションボタン */}
        <div style={{ marginTop: '8px' }}>
          <button
            className="btn-next"
            style={{ width: '100%' }}
            onClick={() => navigate('/')}
          >
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