import NavButtons from '../components/NavButtons'
import { useTryOn } from '../context/TryOnContext'

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

export default function BodyInput() {
  const { bodyData, setBodyData } = useTryOn()

  const handleChange = (e) => {
    const { name, value } = e.target
    setBodyData(prev => ({ ...prev, [name]: value }))
  }

  const fields = [
    { label: '身長', name: 'height', placeholder: '例：160', unit: 'cm' },
    { label: '体重', name: 'weight', placeholder: '例：52', unit: 'kg' },
    { label: '胸囲', name: 'bust', placeholder: '例：85', unit: 'cm' },
    { label: 'ウエスト', name: 'waist', placeholder: '例：68', unit: 'cm' },
    { label: 'ヒップ', name: 'hip', placeholder: '例：90', unit: 'cm' },
  ]

  return (
    <div className="page">
      <ProgressBar current={1} total={4} />

      <div className="page-header">
        <p className="step-label">Step 1 / 4</p>
        <h1 className="page-title">体型情報の入力</h1>
        <p className="page-desc">
          分かる範囲だけ入力してください。<br />
          すべて空欄でも次へ進めます。
        </p>
      </div>

      <div className="page-content">

        {/* サイズ選択カード */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#333' }}>普段よく着るサイズ</span>
            <span className="form-optional">任意</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['XS', 'S', 'M', 'L', 'XL'].map(size => (
              <button
                key={size}
                onClick={() => setBodyData(prev => ({ ...prev, usualSize: size }))}
                style={{
                  flex: 1,
                  height: '40px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: bodyData.usualSize === size ? '#E8A0A8' : '#FAF5F0',
                  color: bodyData.usualSize === size ? '#fff' : '#999',
                  transition: 'all 0.15s',
                }}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* 数値入力カード */}
        <div className="card">
          {fields.map(({ label, name, placeholder, unit }, index) => (
            <div key={name} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 0',
              borderBottom: index < fields.length - 1 ? '1px solid #F0EBE4' : 'none',
            }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#555', width: '72px' }}>
                {label}
              </span>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  name={name}
                  placeholder={placeholder}
                  value={bodyData[name]}
                  onChange={handleChange}
                  style={{
                    flex: 1,
                    height: '40px',
                    background: '#FAF5F0',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0 12px',
                    fontSize: '15px',
                    color: '#333',
                    outline: 'none',
                  }}
                />
                <span style={{ fontSize: '13px', color: '#bbb', width: '24px' }}>{unit}</span>
              </div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: '12px', color: '#bbb', textAlign: 'center', marginTop: '8px' }}>
          入力した情報は試着精度の向上に使われます
        </p>

      </div>

      <NavButtons prevPath="/" nextPath="/upload-user" />
    </div>
  )
}