import { useState } from 'react'

export default function ShareButton({ imageUrl }) {
  const [toast, setToast] = useState(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleSaveImage = async () => {
    if (!imageUrl) return
    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = imageUrl
      })
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      canvas.toBlob((blob) => {
        if (!blob) {
          showToast('保存できませんでした。画像を長押しして保存してください。')
          return
        }
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'tryon-result.png'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        showToast('画像を保存しました！')
      }, 'image/png')
    } catch {
      showToast('保存できませんでした。画像を長押しして保存してください。')
    }
  }

  const handleShare = async () => {
    const shareUrl = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI試着結果',
          text: 'AIバーチャル試着をやってみました！',
          url: shareUrl,
        })
      } catch (e) {
        if (e.name !== 'AbortError') {
          showToast('シェアに失敗しました。')
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl)
        showToast('URLをコピーしました！')
      } catch {
        showToast('コピーに失敗しました。')
      }
    }
  }

  return (
    <div className="share-button-group">
      <button className="btn-share" onClick={handleSaveImage}>
        画像を保存する
      </button>
      <button className="btn-share" onClick={handleShare}>
        シェアする
      </button>
      {toast && <div className="share-toast">{toast}</div>}
    </div>
  )
}
