import { useRef, useState } from 'react'
import { useTryOn } from '../context/TryOnContext'
import { supabase } from '../supabase'
import ShareButton from '../components/ShareButton'
import NavButtons from '../components/NavButtons'

const BADGE_COLORS = {
  tops: { bg: '#EBF4FF', color: '#2D6EA6' },
  bottoms: { bg: '#F0EBFF', color: '#6B42C8' },
  'one-pieces': { bg: '#FFF0EB', color: '#C85A28' },
}

const CATEGORY_LABELS = {
  tops: 'トップス',
  bottoms: 'ボトムス',
  'one-pieces': 'ワンピース',
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
    }
    img.src = url
  })
}

async function runFashnTryOn(modelImage, garmentImage, category, onProgress) {
  const requestBody = {
    model_name: 'tryon-v1.6',
    inputs: {
      model_image: modelImage,
      garment_image: garmentImage,
      category,
    },
  }
  console.log('[FASHN] リクエスト:', JSON.stringify(requestBody, null, 2))

  const response = await fetch('https://api.fashn.ai/v1/run', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_FASHN_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  const data = await response.json()
  console.log('[FASHN] 初回レスポンス:', JSON.stringify(data, null, 2))

  const taskId = data?.id
  if (!taskId) {
    throw new Error(data?.message || data?.error || JSON.stringify(data))
  }

  const MAX_POLLS = 100
  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise(r => setTimeout(r, 3000))
    if (onProgress) onProgress(Math.min(Math.round(((i + 1) / MAX_POLLS) * 100), 99))
    const statusRes = await fetch(`https://api.fashn.ai/v1/status/${taskId}`, {
      headers: { 'Authorization': `Bearer ${import.meta.env.VITE_FASHN_API_KEY}` },
    })
    const statusData = await statusRes.json()
    const status = statusData?.status
    console.log(`[FASHN] ポーリング ${i + 1} - status: ${status}`)
    if (status === 'completed') {
      const resultUrl = statusData?.output?.[0]
      console.log('[FASHN] 完了:', resultUrl)
      if (onProgress) onProgress(100)
      return resultUrl
    } else if (status === 'failed') {
      throw new Error(statusData?.error?.message || statusData?.error || '不明なエラー')
    }
  }
  throw new Error('時間がかかっています。もう一度お試しください。')
}

async function saveIntermediateImage(url) {
  const response = await fetch(url)
  const blob = await response.blob()
  const fileName = `intermediate-${Date.now()}.jpg`
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
  const [loadingStep, setLoadingStep] = useState(null) // null | 'tops-1of2' | 'bottoms-2of2' | 'single'
  const [progress, setProgress] = useState(0)
  const [tryonError, setTryonError] = useState(null)

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

  const handleAITryOn = async () => {
    const closetImage = combinedOutfit?.closetImage
    const closetCat = combinedOutfit?.closetFashnCategory || 'tops'
    const newClothesImage = combinedOutfit?.newClothesImage
    const newCat = combinedOutfit?.newClothesFashnCategory || 'tops'

    if (!userImage) {
      setTryonError('処理に失敗しました：自分の写真を先に追加してください。')
      return
    }
    if (!closetImage && !newClothesImage) {
      setTryonError('処理に失敗しました：試着する服が選択されていません。')
      return
    }
    if (userImage.startsWith('blob:')) {
      setTryonError('処理に失敗しました：あなたの写真のアップロードが完了していません。写真を再度選択してください。')
      return
    }
    if (closetImage?.startsWith('blob:') || newClothesImage?.startsWith('blob:')) {
      setTryonError('処理に失敗しました：服の画像のアップロードが完了していません。前の画面に戻って再度アップロードしてください。')
      return
    }

    setLoading(true)
    setTryonError(null)
    setTryonResult(null)
    setProgress(0)

    try {
      const needsTwoStep =
        (closetCat === 'tops' && newCat === 'bottoms') ||
        (closetCat === 'bottoms' && newCat === 'tops')

      if (needsTwoStep) {
        const topsImage = closetCat === 'tops' ? closetImage : newClothesImage
        const bottomsImage = closetCat === 'bottoms' ? closetImage : newClothesImage

        // Step 1: トップスを試着
        setLoadingStep('tops-1of2')
        setProgress(0)
        console.log('[CoordinateResult] Step1: トップス試着開始')
        const step1Result = await runFashnTryOn(
          userImage, topsImage, 'tops',
          (p) => setProgress(Math.round(p / 2))
        )

        // 中間画像をSupabase Storageに保存
        console.log('[CoordinateResult] 中間画像保存中...')
        const intermediateUrl = await saveIntermediateImage(step1Result)
        console.log('[CoordinateResult] 中間画像URL:', intermediateUrl)

        // Step 2: ボトムスを試着
        setLoadingStep('bottoms-2of2')
        setProgress(50)
        console.log('[CoordinateResult] Step2: ボトムス試着開始')
        const step2Result = await runFashnTryOn(
          intermediateUrl, bottomsImage, 'bottoms',
          (p) => setProgress(50 + Math.round(p / 2))
        )

        setTryonResult(step2Result)

      } else if (closetCat === 'one-pieces' || newCat === 'one-pieces') {
        // ワンピース系：one-piecesを1回試着
        const onePieceImage = closetCat === 'one-pieces' ? closetImage : newClothesImage
        setLoadingStep('single')
        console.log('[CoordinateResult] ワンピース試着開始')
        const result = await runFashnTryOn(userImage, onePieceImage, 'one-pieces', setProgress)
        setTryonResult(result)

      } else {
        // 同カテゴリ：新しい服を優先して1回試着
        const garment = newClothesImage || closetImage
        const cat = newClothesImage ? newCat : closetCat
        setLoadingStep('single')
        console.log(`[CoordinateResult] 単体試着開始 (category: ${cat})`)
        const result = await runFashnTryOn(userImage, garment, cat, setProgress)
        setTryonResult(result)
      }

    } catch (e) {
      console.error('[CoordinateResult] 例外:', e)
      setTryonError(`処理に失敗しました：${e.message || 'ネットワークエラー'}`)
    }

    setLoading(false)
    setLoadingStep(null)
  }

  const loadingMessages = {
    'tops-1of2': { main: 'トップスを試着中...（1/2）', sub: '上半身を着用しています' },
    'bottoms-2of2': { main: 'ボトムスを試着中...（2/2）', sub: '下半身を着用しています' },
    'single': { main: '試着中...', sub: '完了まで3〜5分かかります' },
  }
  const currentMessage = loadingMessages[loadingStep] || { main: '', sub: '' }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">コーデ確認</h1>
        <p className="page-desc">あなたとコーデを確認しましょう</p>
      </div>

      <div className="page-content">

        {/* あなたの写真 */}
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#666', marginBottom: '8px' }}>
          自分の写真を追加する
        </p>

        {userImage ? (
          <div
            className="portrait-preview"
            style={{ marginBottom: '16px', cursor: 'pointer' }}
            onClick={() => inputRef.current.click()}
          >
            <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
            <img src={userImage} alt="あなたの写真" />
            {uploading && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(250,245,240,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '20px', fontSize: '13px', color: '#E8A0A8', fontWeight: 700,
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
            <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
            <div style={{
              width: '64px', height: '64px', borderRadius: '20px',
              background: '#FAF5F0',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px',
            }}>
              📷
            </div>
            <div className="upload-text">
              <strong>タップして写真を選択</strong>
              正面からの全身写真がおすすめです
            </div>
            <div style={{
              background: '#E8A0A8', color: '#fff',
              fontSize: '13px', fontWeight: 700,
              padding: '10px 28px', borderRadius: '20px',
            }}>
              写真を選ぶ
            </div>
            {uploading && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(250,245,240,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '20px', fontSize: '13px', color: '#E8A0A8', fontWeight: 700,
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
        {(combinedOutfit?.closetImage || combinedOutfit?.newClothesImage) && (
          <>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#666', marginBottom: '10px' }}>
              選択したコーデ
            </p>
            <div className="coordinate-preview" style={{ marginBottom: '20px' }}>
              {combinedOutfit?.closetImage && (
                <div className="coordinate-slot">
                  <p className="coordinate-slot__label">クローゼット</p>
                  <div className="coordinate-slot__image">
                    <img src={combinedOutfit.closetImage} alt="クローゼットの服" />
                  </div>
                  {combinedOutfit?.closetFashnCategory && (
                    <span style={{
                      display: 'inline-block',
                      marginTop: '4px',
                      padding: '2px 8px',
                      borderRadius: '20px',
                      fontSize: '10px',
                      fontWeight: 600,
                      background: BADGE_COLORS[combinedOutfit.closetFashnCategory]?.bg || '#F0F0F0',
                      color: BADGE_COLORS[combinedOutfit.closetFashnCategory]?.color || '#666',
                    }}>
                      {CATEGORY_LABELS[combinedOutfit.closetFashnCategory] || combinedOutfit.closetFashnCategory}
                    </span>
                  )}
                </div>
              )}
              {combinedOutfit?.newClothesImage && (
                <div className="coordinate-slot">
                  <p className="coordinate-slot__label">新しい服</p>
                  <div className="coordinate-slot__image">
                    <img src={combinedOutfit.newClothesImage} alt="新しい服" />
                  </div>
                  {combinedOutfit?.newClothesFashnCategory && (
                    <span style={{
                      display: 'inline-block',
                      marginTop: '4px',
                      padding: '2px 8px',
                      borderRadius: '20px',
                      fontSize: '10px',
                      fontWeight: 600,
                      background: BADGE_COLORS[combinedOutfit.newClothesFashnCategory]?.bg || '#F0F0F0',
                      color: BADGE_COLORS[combinedOutfit.newClothesFashnCategory]?.color || '#666',
                    }}>
                      {CATEGORY_LABELS[combinedOutfit.newClothesFashnCategory] || combinedOutfit.newClothesFashnCategory}
                    </span>
                  )}
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
              {loading ? '⏳ AI試着中...' : '✨ AI試着する'}
            </button>
            <ShareButton imageUrl={userImage} />
          </div>
        )}

        {tryonError && (
          <div className="card" style={{ background: '#FFF5F5', color: '#cc0000', textAlign: 'center', fontSize: '13px', marginBottom: '12px' }}>
            {tryonError}
          </div>
        )}

        {/* ローディング表示 */}
        {loading && loadingStep && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', color: '#E8A0A8', fontWeight: 700 }}>
                {currentMessage.main}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#E8A0A8' }}>
                {progress}%
              </span>
            </div>
            <div style={{ background: '#E8E3DC', borderRadius: '8px', height: '10px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #E8A0A8, #F0BEC3)',
                borderRadius: '8px',
                transition: 'width 0.5s ease',
              }} />
            </div>
            <p style={{ fontSize: '11px', color: '#888', textAlign: 'center', marginTop: '8px' }}>
              {currentMessage.sub}
            </p>
          </div>
        )}

        {/* 試着結果 */}
        {tryonResult && (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', textAlign: 'center', color: '#E8A0A8' }}>
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
                onClick={() => { setTryonResult(null); setProgress(0); setLoadingStep(null) }}
              >
                もう一度試着する
              </button>
            </div>
          </div>
        )}

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
