import NavButtons from '../components/NavButtons'
import { useTryOn } from '../context/TryOnContext'

function ProgressBar({ current, total }) {
  return (
    <div className="progress-bar">
      {Array.from({ length: total }, (_, i) => {
        const s = i + 1
        return <div key={i} className={`progress-step ${s < current ? 'done' : s === current ? 'active' : ''}`} />
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

  return (
    <div className="page">
      <ProgressBar current={1} total={4} />
      <div className="page-header">
        <p className="step-label">Step 1 / 4</p>
        <h1 className="page-title">体型情報の入力</h1>
        <p className="page-desc">まずは分かる範囲だけ入力してください。<br />すべて空欄でも次へ進めます。</p>
      </div>
      <div className="page-content">
        <div className="form-group">
          <label className="form-label">身長（cm）<span className="form-optional">任意</span></label>
          <input type="number" name="height" placeholder="例：160" value={bodyData.height} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="form-label">体重（kg）<span className="form-optional">任意</span></label>
          <input type="number" name="weight" placeholder="例：52" value={bodyData.weight} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="form-label">胸囲（cm）<span className="form-optional">任意</span></label>
          <input type="number" name="bust" placeholder="例：85" value={bodyData.bust} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="form-label">ウエスト（cm）<span className="form-optional">任意</span></label>
          <input type="number" name="waist" placeholder="例：68" value={bodyData.waist} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="form-label">ヒップ（cm）<span className="form-optional">任意</span></label>
          <input type="number" name="hip" placeholder="例：90" value={bodyData.hip} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="form-label">普段よく着るサイズ<span className="form-optional">任意</span></label>
          <select name="usualSize" value={bodyData.usualSize} onChange={handleChange}>
            <option value="">選択してください</option>
            <option value="XS">XS</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
          </select>
        </div>
      </div>
      <NavButtons prevPath="/" nextPath="/upload-user" />
    </div>
  )
}