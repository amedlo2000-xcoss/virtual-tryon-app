import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTryOn } from '../context/TryOnContext'
import ShareButton from '../components/ShareButton'
import StepIndicator from '../components/StepIndicator'

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
      <div className="page-header">
        <StepIndicator current={4} total={4} />
        <h1 className="page-title">試着結果</h1>
        <p className="page-desc">AIが試着画像を生成します。</p>
      </div>

      <div className="page-content">

        {/* 入力画像プレビュー（縦型2列） */}
        {(userImage || clothesImage) && !tryonResult && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '11px', color: '#888', textAlign: 'center', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.05em' }}>
                あなたの写真
              </p>
              <div className="result-image-card">
                {userImage
                  ? <img src={userImage} alt="あなたの写真" />
                  : <span style={{ color: '#ccc' }}>写真<br />なし</span>
                }
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '11px', color: '#888', textAlign: 'center', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.05em' }}>
                選んだ服
              </p>
              <div className="result-image-card">
                {clothesImage
                  ? <img src={clothesImage} alt="選んだ服" />
                  : <span style={{ color: '#ccc' }}>服の<br />画像なし</span>
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
            {loading ? 'AI試着中...（3〜5分）' : 'AI試着を開始する'}
          </button>
        )}

        {/* エラー */}
        {error && (
          <div className="card" style={{ background: '#FFF5F5', color: '#cc0000', textAlign: 'center', fontSize: '13px', padding: '16px' }}>
            {error}
          </div>
        )}

        {/* ローディング進捗バー */}
        {loading && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#888' }}>AI処理中...</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#E8A0A8' }}>{progress}%</span>
            </div>
            <div style={{ background: '#F0EBE4', borderRadius: '8px', height: '10px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #E8A0A8, #F0BEC3)',
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

        {/* 試着結果（縦型・大きく表示） */}
        {tryonResult ? (
          <div style={{ marginBottom: '24px' }}>
            {/* 完了バッジ */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '14px',
            }}>
              <span style={{
                background: 'linear-gradient(135deg, #E8A0A8, #F0BEC3)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 700,
                padding: '6px 20px',
                borderRadius: '20px',
                letterSpacing: '0.05em',
              }}>
                試着完了
              </span>
            </div>

            {/* 結果画像（大きく表示） */}
            <div className="portrait-preview" style={{ marginBottom: '16px' }}>
              <img src={tryonResult} alt="試着結果" />
            </div>

            {/* 保存・シェアボタン */}
            <ShareButton imageUrl={tryonResult} />
          </div>
        ) : (
          !loading && (
            <div className="result-placeholder">
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FAF5F0, #F5E6E8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
              }}>
                ✨
              </div>
              <span style={{ color: '#bbb', fontSize: '14px', lineHeight: 1.7 }}>
                ここにAI試着結果が<br />表示されます
              </span>
            </div>
          )
        )}

        {/* 体型情報 */}
        {filledBody.length > 0 && (
          <div className="card">
            <strong style={{ display: 'block', marginBottom: '10px', color: '#333', fontSize: '14px' }}>
              入力した体型情報
            </strong>
            {filledBody.map(([key, val]) => (
              <div key={key} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid #F0EBE4',
                fontSize: '14px',
              }}>
                <span style={{ color: '#888' }}>{bodyLabels[key]}</span>
                <span style={{ fontWeight: 700, color: '#333' }}>
                  {val}{key !== 'usualSize' ? ' cm / kg' : ''}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* もう一度試す */}
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
