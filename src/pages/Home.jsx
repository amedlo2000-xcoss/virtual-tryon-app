import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="page">
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', gap:'20px' }}>
        <div style={{ fontSize:'64px' }}>👗</div>
        <div>
          <h1 style={{ fontSize:'26px', fontWeight:700, color:'#111', marginBottom:'10px' }}>Virtual Try-On</h1>
          <p style={{ fontSize:'15px', color:'#777', lineHeight:1.8, maxWidth:'300px' }}>
            写真と体型情報から<br />試着イメージを確認できます
          </p>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'8px', width:'100%', maxWidth:'320px' }}>
          {['① 体型情報を入力（任意）','② あなたの写真をアップロード','③ 着せたい服を選択','④ 試着イメージを確認'].map((text, i) => (
            <div key={i} className="card" style={{ marginBottom:0, textAlign:'left' }}>{text}</div>
          ))}
        </div>
        <button className="btn-next" style={{ width:'100%', maxWidth:'320px' }} onClick={() => navigate('/body')}>
          はじめる
        </button>
      </div>
    </div>
  )
}