import { useRef, useState } from 'react'
import { useTryOn } from '../context/TryOnContext'
import { supabase } from '../supabase'
import ShareButton from '../components/ShareButton'
import NavButtons from '../components/NavButtons'

// const PIAPI_KEY = 'b123fd0c2caa35b6258b8b86543fc4dace1a66a07de1da4cdff3f84001cd1d50'
const CANVAS_W = 768
const CANVAS_H = 1024
const HALF_W = CANVAS_W / 2 // 384

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

function loadImageWithCORS(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`画像の読み込みに失敗しました: ${url}`))
    img.src = url
  })
}

async function composeAndUpload(leftUrl, rightUrl) {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_W
  canvas.height = CANVAS_H
  const ctx = canvas.getContext('2d')

  // 白背景
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

  // 左側（クローゼットの服）
  if (leftUrl) {
    const imgA = await loadImageWithCORS(leftUrl)
    const scale = Math.min(HALF_W / imgA.width, CANVAS_H / imgA.height)
    const w = imgA.width * scale
    const h = imgA.height * scale
    const x = (HALF_W - w) / 2
    const y = (CANVAS_H - h) / 2
    ctx.drawImage(imgA, x, y, w, h)
  }

  // 右側（新しい服）
  if (rightUrl) {
    const imgB = await loadImageWithCORS(rightUrl)
    const scale = Math.min(HALF_W / imgB.width, CANVAS_H / imgB.height)
    const w = imgB.width * scale
    const h = imgB.height * scale
    const x = HALF_W + (HALF_W - w) / 2
    const y = (CANVAS_H - h) / 2
    ctx.drawImage(imgB, x, y, w, h)
  }

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b)
      else reject(new Error('Canvas to Blob の変換に失敗しました'))
    }, 'image/jpeg', 0.9)
  })

  const fileName = `coordinate-${Date.now()}.jpg`
  const { error } = await supabase.storage
    .from('tryon-images')
    .upload(fileName, blob, { upsert: true, contentType: 'image/jpeg' })
  if (error) throw error

  const { data: urlData } = supabase.storage
    .from('tryon-images')
    .getPublicUrl(fileName)

  return urlData.publicUrl
}

export default function CoordinateResult() {
  const { userImage, setUserImage, combinedOutfit } = useTryOn()
  const inputRef = useRef(null)

  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  const [tryonResult, setTryonResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [compositeStep, setCompositeStep] = useState(0) // 0=idle 1=合成中 2=AI処理中
  const [progress, setProgress] = useState(0)
  const [tryonError, setTryonError] = useState(null)

  // ---- 自分の写真アップロード ----
  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)
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

  // ---- AI試着（2ステップ） ----
  const handleAITryOn = async () => {
    const closetImageUrl = combinedOutfit?.closetItem?.image_url
    const newClothesUrl = combinedOutfit?.newClothes

    if (!userImage) {
      setTryonError('処理に失敗しました：自分の写真を先に追加してください。')
      return
    }
    if (!closetImageUrl && !newClothesUrl) {
      setTryonError('処理に失敗しました：試着する服が選択されていません。')
      return
    }
    if (userImage.startsWith('blob:')) {
      setTryonError('処理に失敗しました：あなたの写真のアップロードが完了していません。写真を再度選択してください。')
      console.error('[CoordinateResult] model_input が blob URL です。', userImage)
      return
    }
    if (closetImageUrl?.startsWith('blob:') || newClothesUrl?.startsWith('blob:')) {
      setTryonError('処理に失敗しました：服の画像のアップロードが完了していません。前の画面に戻って再度アップロードしてください。')
      console.error('[CoordinateResult] dress_input が blob URL です。', { closetImageUrl, newClothesUrl })
      return
    }

    setLoading(true)
    setTryonError(null)
    setTryonResult(null)
    setProgress(0)

    try {
      // ---- ステップ①：A+B=D（Canvas合成） ----
      setCompositeStep(1)
      console.log('[CoordinateResult] ステップ①：Canvas合成開始', { closetImageUrl, newClothesUrl })
      const dressUrl = await composeAndUpload(closetImageUrl, newClothesUrl)
      console.log('[CoordinateResult] ステップ①完了。dressUrl:', dressUrl)

      // ---- ステップ②：C+D=E（FASHN V1.6 AI試着） ----
      setCompositeStep(2)
      console.log('[CoordinateResult] ステップ②：FASHN V1.6リクエスト開始')

      // ---- PiAPI（旧）----
      // const requestBody = {
      //   model: 'kling',
      //   task_type: 'ai_try_on',
      //   input: {
      //     model_input: userImage,
      //     dress_input: dressUrl,
      //     batch_size: 1,
      //   },
      // }
      // console.log('[CoordinateResult] PiAPIリクエスト内容:', JSON.stringify(requestBody, null, 2))
      // const response = await fetch('https://api.piapi.ai/api/v1/task', {
      //   method: 'POST',
      //   headers: {
      //     'x-api-key': PIAPI_KEY,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(requestBody),
      // })
      // const data = await response.json()
      // console.log('[CoordinateResult] PiAPI初回レスポンス:', JSON.stringify(data, null, 2))
      // const taskId = data?.data?.task_id

      const fashnRequestBody = {
        model_name: 'tryon-v1.6',
        inputs: {
          model_image: userImage,
          garment_image: dressUrl,
          category: 'auto',
        },
      }
      console.log('[CoordinateResult] FASHN V1.6リクエスト内容:', JSON.stringify(fashnRequestBody, null, 2))

      const fashnResponse = await fetch('https://api.fashn.ai/v1/run', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_FASHN_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fashnRequestBody),
      })

      const fashnData = await fashnResponse.json()
      console.log('[CoordinateResult] FASHN V1.6初回レスポンス:', JSON.stringify(fashnData, null, 2))

      const taskId = fashnData?.id
      if (!taskId) {
        const errMsg = fashnData?.message || fashnData?.error || JSON.stringify(fashnData)
        console.error('[CoordinateResult] id が取得できませんでした。レスポンス:', fashnData)
        setTryonError(`処理に失敗しました：${errMsg}`)
        setLoading(false)
        setCompositeStep(0)
        return
      }

      console.log('[CoordinateResult] FASHN task id:', taskId)

      const MAX_POLLS = 100
      let result = null
      for (let i = 0; i < MAX_POLLS; i++) {
        await new Promise(r => setTimeout(r, 3000))
        setProgress(Math.min(Math.round(((i + 1) / MAX_POLLS) * 100), 99))
        const statusRes = await fetch(`https://api.fashn.ai/v1/status/${taskId}`, {
          headers: { 'Authorization': `Bearer ${import.meta.env.VITE_FASHN_API_KEY}` },
        })
        const statusData = await statusRes.json()
        const status = statusData?.status
        console.log(`[CoordinateResult] ポーリング ${i + 1}/${MAX_POLLS} - ステータス: ${status}`, statusData)
        if (status === 'completed') {
          result = statusData?.output?.[0]
          console.log('[CoordinateResult] 試着完了。結果URL:', result)
          setProgress(100)
          break
        } else if (status === 'failed') {
          const errMsg = statusData?.error?.message || statusData?.error || '不明なエラー'
          console.error('[CoordinateResult] 試着処理失敗。詳細:', statusData)
          setTryonError(`処理に失敗しました：${errMsg}`)
          setLoading(false)
          setCompositeStep(0)
          return
        }
      }

      if (result) {
        setTryonResult(result)
      } else {
        setTryonError('時間がかかっています。もう一度お試しください。')
      }
    } catch (e) {
      console.error('[CoordinateResult] 例外エラー:', e)
      setTryonError(`処理に失敗しました：${e.message || 'ネットワークエラー'}`)
    }

    setLoading(false)
    setCompositeStep(0)
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

        {/* ローディング表示 */}
        {loading && compositeStep === 1 && (
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: '#C8956C', fontWeight: 700 }}>
              コーデを合成中...
            </p>
            <p style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>
              クローゼットの服と新しい服を組み合わせています
            </p>
          </div>
        )}

        {loading && compositeStep === 2 && (
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
                onClick={() => { setTryonResult(null); setProgress(0); setCompositeStep(0) }}
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
