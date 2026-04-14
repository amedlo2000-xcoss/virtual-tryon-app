import { useRef, useState } from 'react'
import { useTryOn } from '../context/TryOnContext'
import { supabase } from '../supabase'
import ShareButton from '../components/ShareButton'
import NavButtons from '../components/NavButtons'

const PIAPI_KEY = 'b123fd0c2caa35b6258b8b86543fc4dace1a66a07de1da4cdff3f84001cd1d50'

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
    }
    img.src = url
  })
}

export default function CoordinateResult() {
  const { userImage, setUserImage, combinedOutfit } = useTryOn()
  const inputRef = useRef(null)

  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  const [tryonResult, setTryonResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [tryonError, setTryonError] = useState(null)

  // ---- 自分の写真アップロード ----
  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)
    // ローカルプレビューを先に表示
    const localUrl = URL.createObjectURL(file)
    setUserImage(localUrl)
    try {
      const resized = await resizeImage(file)
      const fileName = `user_${Date.now()}.jpg`
      const { error } = await supabase.storage
        .from('tryon-images')
        .upload(fileName, resized, { upsert: true, contentType: 'image/jpeg' })
      if (error) throw error
      const { data: urlData } = supabase.storage
        .from('tryon-images')
        .getPublicUrl(fileName)
      setUserImage(urlData.publicUrl)
    } catch (err) {
      console.error(err)
      setUploadError('アップロードに失敗しました。もう一度お試しください。')
    }
    setUploading(false)
  }

  // ---- AI試着 ----
  const handleAITryOn = async () => {
    const dressUrl = combinedOutfit?.newClothes
    if (!userImage) {
      setTryonError('自分の写真を先に追加してください。')
      return
    }
    if (!dressUrl) {
      setTryonError('試着する服が選択されていません。')
      return
    }
    setLoading(true)
    setTryonError(null)
    setTryonResult(null)
    setProgress(0)

    try {
      const response = await fetch('https://api.piapi.ai/api/v1/task', {
        method: 'POST',
        headers: {
          'x-api-key': PIAPI_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'kling',
          task_type: 'ai_try_on',
          input: {
            model_input: userImage,
            dress_input: dressUrl,
            batch_size: 1,
          },
        }),
      })

      const data = await response.json()
      const taskId = data?.data?.task_id

      if (!taskId) {
        setTryonError('処理の開始に失敗しました。')
        setLoading(false)
        return
      }

      const MAX_POLLS = 60
      let result = null
      for (let i = 0; i < MAX_POLLS; i++) {
        await new Promise(r => setTimeout(r, 5000))
        setProgress(Math.min(Math.round(((i + 1) / MAX_POLLS) * 100), 99))
        const statusRes = await fetch(`https://api.piapi.ai/api/v1/task/${taskId}`, {
          headers: { 'x-api-key': PIAPI_KEY },
        })
        const statusData = await statusRes.json()
        const status = statusData?.data?.status
        if (status === 'completed') {
          result = statusData?.data?.output?.works?.[0]?.image?.resource
          setProgress(100)
          break
        } else if (status === 'failed') {
          setTryonError('試着処理に失敗しました。')
          setLoading(false)
          return
        }
      }

      if (result) {
        setTryonResult(result)
      } else {
        setTryonError('タイムアウトしました。もう一度お試しください。')
      }
    } catch (e) {
      console.error(e)
      setTryonError('エラーが発生しました。')
    }
    setLoading(false)
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">コーデ確認</h1>
        <p className="page-desc">あなたとコーデを確認しましょう</p>
      </div>

      <div className="page-content">

        {/* あなたの写真 or アップロードエリア */}
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#666', marginBottom: '8px' }}>
          自分の写真を追加する
        </p>

        {userImage ? (
          <div
            className="portrait-preview"
            style={{ marginBottom: '16px', cursor: 'pointer' }}
            onClick={() => inputRef.current.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFile}
            />
            <img src={userImage} alt="あなたの写真" />
            {uploading && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(247,245,242,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '20px',
                fontSize: '13px',
                color: '#C8956C',
                fontWeight: 700,
              }}>
                アップロード中...
              </div>
            )}
          </div>
        ) : (
          <div
            className="portrait-upload-frame"
            style={{ marginBottom: '16px', position: 'relative' }}
            onClick={() => inputRef.current.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFile}
            />
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: '#F7F5F2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
            }}>
              📷
            </div>
            <div className="upload-text">
              <strong>タップして写真を選択</strong>
              正面からの全身写真がおすすめです
            </div>
            <div style={{
              background: '#C8956C',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 700,
              padding: '10px 28px',
              borderRadius: '20px',
            }}>
              写真を選ぶ
            </div>
            {uploading && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(247,245,242,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '20px',
                fontSize: '13px',
                color: '#C8956C',
                fontWeight: 700,
              }}>
                アップロード中...
              </div>
            )}
          </div>
        )}

        {uploadError && (
          <div className="card" style={{ background: '#FFF5F5', color: '#cc0000', textAlign: 'center', fontSize: '13px', marginBottom: '12px' }}>
            {uploadError}
          </div>
        )}

        {/* 選択したコーデ */}
        {(combinedOutfit?.closetItem || combinedOutfit?.newClothes) && (
          <>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#666', marginBottom: '10px' }}>
              選択したコーデ
            </p>
            <div className="coordinate-preview" style={{ marginBottom: '20px' }}>
              {combinedOutfit?.closetItem && (
                <div className="coordinate-slot">
                  <p className="coordinate-slot__label">クローゼット</p>
                  <div className="coordinate-slot__image">
                    <img
                      src={combinedOutfit.closetItem.image_url}
                      alt={combinedOutfit.closetItem.name}
                    />
                  </div>
                </div>
              )}
              {combinedOutfit?.newClothes && (
                <div className="coordinate-slot">
                  <p className="coordinate-slot__label">新しい服</p>
                  <div className="coordinate-slot__image">
                    <img src={combinedOutfit.newClothes} alt="新しい服" />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* AI試着ボタン */}
        {!tryonResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            <button
              className="btn-primary"
              onClick={handleAITryOn}
              disabled={loading || uploading}
            >
              {loading ? '⏳ AI試着中...（3〜5分）' : '✨ AI試着する'}
            </button>
            <ShareButton imageUrl={userImage} />
          </div>
        )}

        {/* エラー */}
        {tryonError && (
          <div className="card" style={{ background: '#FFF5F5', color: '#cc0000', textAlign: 'center', fontSize: '13px', marginBottom: '12px' }}>
            {tryonError}
          </div>
        )}

        {/* ローディング進捗バー */}
        {loading && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: '#aaa' }}>AI処理中...</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#C8956C' }}>{progress}%</span>
            </div>
            <div style={{ background: '#E8E3DC', borderRadius: '8px', height: '10px', overflow: 'hidden' }}>
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

        {/* 試着結果 */}
        {tryonResult && (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', textAlign: 'center', color: '#C8956C' }}>
              試着完了！
            </p>
            <div className="portrait-preview" style={{ marginBottom: '16px' }}>
              <img src={tryonResult} alt="試着結果" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <ShareButton imageUrl={tryonResult} />
              <button
                className="btn-primary"
                style={{ background: '#EDE8E1', color: '#666' }}
                onClick={() => { setTryonResult(null); setProgress(0) }}
              >
                もう一度試着する
              </button>
            </div>
          </div>
        )}

        {/* 結果が出る前・ローディング中でないときのプレースホルダー */}
        {!tryonResult && !loading && (
          <div className="result-placeholder">
            <span style={{ fontSize: '48px' }}>✨</span>
            <span style={{ color: '#ccc', fontSize: '14px', lineHeight: 1.7 }}>
              ここにAI試着結果が<br />表示されます
            </span>
          </div>
        )}

      </div>

      <NavButtons prevPath="/coordinate" />
    </div>
  )
}
