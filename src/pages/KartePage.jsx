import { useState, useRef } from 'react'
import CameraGuide from '../components/CameraGuide'
import KarteCard from '../components/KarteCard'
import KarteShareButton from '../components/KarteShareButton'
import { analyzeImage } from '../services/analyzeService'

export default function KartePage() {
  const [status, setStatus] = useState('idle') // idle | analyzing | done | error
  const [karteData, setKarteData] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const karteRef = useRef(null)

  function handleImageReady(file, dataUrl) {
    setImageFile(file)
    setPreviewUrl(dataUrl)
    setStatus('idle')
    setKarteData(null)
  }

  async function handleAnalyze() {
    if (!imageFile) return
    setStatus('analyzing')
    setErrorMsg('')
    try {
      const reader = new FileReader()
      const base64 = await new Promise((resolve, reject) => {
        reader.onload = (e) => {
          const result = e.target?.result
          if (!result) { reject(new Error('画像の読み込みに失敗しました')); return }
          const parts = result.split(',')
          if (parts.length < 2) { reject(new Error('画像フォーマットが不正です')); return }
          resolve(parts[1])
        }
        reader.onerror = () => reject(new Error('ファイルの読み込みエラー'))
        reader.readAsDataURL(imageFile)
      })
      const mimeType = imageFile.type || 'image/jpeg'
      const data = await analyzeImage(base64, mimeType)
      setKarteData(data)
      setStatus('done')
    } catch (err) {
      setErrorMsg(err.message || '分析中にエラーが発生しました')
      setStatus('error')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#faf5f0',
      fontFamily: '"Hiragino Mincho ProN", "Yu Mincho", serif',
    }}>
      {/* ページヘッダー */}
      <div style={{
        background: 'linear-gradient(135deg, #a07840 0%, #c9a96e 60%, #f0ddb0 100%)',
        padding: '20px 16px 16px',
        textAlign: 'center',
        color: '#fff',
      }}>
        <div style={{ fontSize: 10, letterSpacing: '0.3em', opacity: 0.85, marginBottom: 4 }}>
          AI FACE ANALYSIS
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.1em' }}>
          顔診断カルテ
        </div>
      </div>

      <div style={{ padding: '24px 16px', maxWidth: 520, margin: '0 auto' }}>
        {/* カメラガイド */}
        {status !== 'done' && (
          <div style={{ marginBottom: 24 }}>
            <p style={{
              textAlign: 'center',
              fontSize: 13,
              color: '#666',
              marginBottom: 16,
              lineHeight: 1.7,
            }}>
              正面から撮影した顔写真を選択してください。<br />
              楕円のガイドに顔を合わせると精度が上がります。
            </p>

            <CameraGuide onImageReady={handleImageReady} />

            {/* プレビュー */}
            {previewUrl && (
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <img
                  src={previewUrl}
                  alt="選択した写真"
                  style={{
                    width: 140,
                    height: 140,
                    objectFit: 'cover',
                    borderRadius: '50%',
                    border: '3px solid #c9a96e',
                    boxShadow: '0 2px 12px rgba(160,120,64,0.25)',
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* 診断ボタン */}
        {imageFile && status === 'idle' && (
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <button
              onClick={handleAnalyze}
              style={{
                padding: '14px 40px',
                background: 'linear-gradient(135deg, #c9a96e, #a07840)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.1em',
                boxShadow: '0 4px 16px rgba(160,120,64,0.3)',
              }}
            >
              診断スタート
            </button>
          </div>
        )}

        {/* 分析中 */}
        {status === 'analyzing' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{
              width: 44,
              height: 44,
              border: '4px solid #f0ddb0',
              borderTop: `4px solid #c9a96e`,
              borderRadius: '50%',
              animation: 'karte-spin 0.8s linear infinite',
              margin: '0 auto 16px',
            }} />
            <style>{`@keyframes karte-spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ fontSize: 15, color: '#a07840', fontWeight: 600, letterSpacing: '0.1em' }}>
              Claude が分析中...
            </div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
              少々お待ちください（30秒〜1分程度）
            </div>
          </div>
        )}

        {/* エラー */}
        {status === 'error' && (
          <div style={{
            background: '#fff5f5',
            border: '1px solid #ffcccc',
            borderRadius: 8,
            padding: '16px',
            textAlign: 'center',
            marginBottom: 24,
          }}>
            <div style={{ fontSize: 14, color: '#c0392b', marginBottom: 12 }}>{errorMsg}</div>
            <button
              onClick={() => setStatus('idle')}
              style={{
                padding: '8px 24px',
                background: '#c9a96e',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              やり直す
            </button>
          </div>
        )}

        {/* 結果カルテ */}
        {status === 'done' && karteData && (
          <div>
            <KarteCard ref={karteRef} data={karteData} />

            <div style={{ textAlign: 'center', margin: '20px 0 12px' }}>
              <KarteShareButton karteRef={karteRef} />
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => {
                  setStatus('idle')
                  setKarteData(null)
                  setImageFile(null)
                  setPreviewUrl(null)
                }}
                style={{
                  padding: '10px 24px',
                  background: 'transparent',
                  color: '#a07840',
                  border: '1px solid #c9a96e',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                別の写真で診断する
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
