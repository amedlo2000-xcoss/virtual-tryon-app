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

  const handleInstagram = async () => {
    if (navigator.share && imageUrl) {
      try {
        const res = await fetch(imageUrl)
        const blob = await res.blob()
        const file = new File([blob], 'tryon-result.jpg', { type: blob.type || 'image/jpeg' })
        await navigator.share({
          title: 'AI試着結果',
          text: 'Mironで試着してみた！着た自分を、買う前に確認できるよ✨',
          files: [file],
        })
      } catch (e) {
        if (e.name !== 'AbortError') {
          showToast('Instagramアプリからシェアしてください。')
        }
      }
    } else {
      showToast('この端末ではInstagramシェアに非対応です。')
    }
  }

  const handleLine = () => {
    const text = encodeURIComponent('Mironで試着してみた！着た自分を、買う前に確認できるよ✨')
    const url = encodeURIComponent(window.location.href)
    window.open(`https://social-plugins.line.me/lineit/share?url=${url}&text=${text}`, '_blank')
  }

  const handleTwitter = () => {
    const text = encodeURIComponent('Mironで試着してみた！着た自分を、買う前に確認できるよ✨')
    const url = encodeURIComponent(window.location.href)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* 保存ボタン */}
      <button
        onClick={handleSaveImage}
        style={{
          width: '100%',
          padding: '13px',
          background: '#C9A96E',
          color: '#fff',
          border: 'none',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        💾 画像を保存する
      </button>

      {/* SNSシェアボタン行 */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {/* Instagram */}
        <button
          onClick={handleInstagram}
          style={{
            flex: 1,
            padding: '12px 8px',
            background: '#E1306C',
            color: '#fff',
            border: 'none',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
          <span>Instagram</span>
        </button>

        {/* LINE */}
        <button
          onClick={handleLine}
          style={{
            flex: 1,
            padding: '12px 8px',
            background: '#06C755',
            color: '#fff',
            border: 'none',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
            <path d="M11 2C6.03 2 2 5.63 2 10.08c0 3.99 3.54 7.33 8.33 7.94l.36.05v2.43c0 .29.33.44.55.26l3.3-2.69c2.9-.87 5-3.23 5-5.99C19.54 5.63 15.97 2 11 2z" fill="#fff"/>
          </svg>
          <span>LINE</span>
        </button>

        {/* X (Twitter) */}
        <button
          onClick={handleTwitter}
          style={{
            flex: 1,
            padding: '12px 8px',
            background: '#000000',
            color: '#fff',
            border: 'none',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.26 5.631 5.904-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          <span>X</span>
        </button>
      </div>

      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '90px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#333',
          color: '#fff',
          padding: '10px 20px',
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: 600,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          zIndex: 1000,
          whiteSpace: 'nowrap',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
