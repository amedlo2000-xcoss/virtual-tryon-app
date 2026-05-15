import html2canvas from 'html2canvas'

export default function KarteShareButton({ karteRef }) {
  async function handleShare() {
    const el = karteRef?.current
    if (!el) return

    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      })

      canvas.toBlob(async (blob) => {
        if (!blob) return
        const file = new File([blob], 'face-karte.png', { type: 'image/png' })

        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'AI顔診断カルテ',
            text: 'AIが分析した私の顔診断カルテです！',
          })
        } else {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = 'face-karte.png'
          a.click()
          setTimeout(() => URL.revokeObjectURL(url), 3000)
        }
      }, 'image/png')
    } catch (err) {
      console.error('Share error:', err)
    }
  }

  return (
    <button
      onClick={handleShare}
      style={{
        padding: '12px 32px',
        background: 'linear-gradient(135deg, #c9a96e, #a07840)',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        fontSize: 15,
        fontWeight: 600,
        cursor: 'pointer',
        letterSpacing: '0.05em',
        boxShadow: '0 2px 8px rgba(160,120,64,0.3)',
      }}
    >
      カルテを保存・シェア
    </button>
  )
}
