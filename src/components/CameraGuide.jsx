import { useRef } from 'react'

export default function CameraGuide({ onImageReady }) {
  const inputRef = useRef(null)

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onImageReady(file, ev.target.result)
    reader.readAsDataURL(file)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* ガイドオーバーレイ */}
      <div
        style={{
          position: 'relative',
          width: 280,
          height: 360,
          borderRadius: 12,
          overflow: 'hidden',
          background: '#1a1a1a',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        }}
      >
        <svg
          width="280"
          height="360"
          viewBox="0 0 280 360"
          style={{ position: 'absolute', inset: 0 }}
        >
          {/* 顔楕円 */}
          <ellipse
            cx="140" cy="170" rx="80" ry="110"
            fill="none" stroke="#c9a96e" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.7"
          />

          {/* 縦中心線 */}
          <line
            x1="140" y1="20" x2="140" y2="340"
            stroke="#c9a96e" strokeWidth="1" strokeDasharray="5 5" opacity="0.6"
          />

          {/* 三庭横線 (上段・中段・下段) */}
          {/* 上庭: 髪際〜眉 */}
          <line x1="60" y1="90" x2="220" y2="90"
            stroke="#c9a96e" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
          {/* 中庭: 眉〜鼻先 */}
          <line x1="60" y1="170" x2="220" y2="170"
            stroke="#c9a96e" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
          {/* 下庭: 鼻先〜顎 */}
          <line x1="60" y1="250" x2="220" y2="250"
            stroke="#c9a96e" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />

          {/* 鼻先マーカー */}
          <circle cx="140" cy="190" r="5" fill="#00c853" opacity="0.85" />
          <circle cx="140" cy="190" r="9" fill="none" stroke="#00c853" strokeWidth="1.5" opacity="0.5" />

          {/* コーナー装飾 */}
          {[
            [30, 30, 30, 55, 55, 30],
            [250, 30, 250, 55, 225, 30],
            [30, 330, 30, 305, 55, 330],
            [250, 330, 250, 305, 225, 330],
          ].map(([x1, y1, x2, y2, x3, y3], i) => (
            <g key={i} stroke="#c9a96e" strokeWidth="2" fill="none" opacity="0.9">
              <line x1={x1} y1={y1} x2={x2} y2={y2} />
              <line x1={x1} y1={y1} x2={x3} y2={y3} />
            </g>
          ))}
        </svg>

        {/* ガイドテキスト */}
        <div style={{
          position: 'absolute',
          bottom: 12,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: '#c9a96e',
          fontSize: 11,
          letterSpacing: '0.08em',
        }}>
          顔を楕円に合わせてください
        </div>
      </div>

      {/* ファイル選択 */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        style={{ display: 'none' }}
      />
      <button
        onClick={() => inputRef.current?.click()}
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
        }}
      >
        写真を選択
      </button>
    </div>
  )
}
