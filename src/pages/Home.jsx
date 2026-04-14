import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  return (
    <div className="page" style={{ padding: '32px 16px 100px' }}>

      {/* ヘッダー */}
      <div style={{ textAlign: 'center', marginBottom: '32px', position: 'relative' }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: 800,
          color: '#333',
          letterSpacing: '0.05em',
        }}>
          Miron
        </h1>
        <p style={{ fontSize: '13px', color: '#C8956C', fontWeight: 600, letterSpacing: '0.1em' }}>
          VIRTUAL TRY-ON
        </p>
        <button
          onClick={handleSignOut}
          style={{
            position: 'absolute',
            top: '4px',
            right: 0,
            background: 'none',
            border: '1.5px solid #E8E0D8',
            borderRadius: '20px',
            padding: '6px 14px',
            fontSize: '12px',
            color: '#999',
            cursor: 'pointer',
            fontWeight: 600,
            visibility: user ? 'visible' : 'hidden',
            pointerEvents: user ? 'auto' : 'none',
          }}
        >
          ログアウト
        </button>
      </div>

      {/* メインバナーカード */}
      <div style={{
        background: 'linear-gradient(145deg, #F5E6D8, #EDD5BE)',
        borderRadius: '24px',
        padding: '32px 24px',
        textAlign: 'center',
        marginBottom: '20px',
        boxShadow: '0 4px 20px rgba(200, 149, 108, 0.2)',
      }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>👗</div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#333', marginBottom: '8px' }}>
          着た自分を、買う前に見る
        </h2>
        <p style={{ fontSize: '14px', color: '#888', lineHeight: 1.7 }}>
          写真と体型情報から<br />試着イメージを確認できます
        </p>
      </div>

      {/* ステップカード */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
        {[
          { icon: '📏', step: '01', title: '体型情報を入力', desc: '身長・体重などを入力（任意）' },
          { icon: '📷', step: '02', title: 'あなたの写真', desc: '全身または上半身の写真' },
          { icon: '👚', step: '03', title: '着せたい服を選択', desc: '試着したい服の画像をアップ' },
          { icon: '✨', step: '04', title: 'AI試着結果を確認', desc: 'AIが合成した試着画像を表示' },
        ].map((item) => (
          <div key={item.step} className="card" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '14px 16px',
            marginBottom: 0,
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: '#F7F5F2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              flexShrink: 0,
            }}>
              {item.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#C8956C' }}>{item.step}</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#333' }}>{item.title}</span>
              </div>
              <p style={{ fontSize: '12px', color: '#999' }}>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* スタートボタン */}
      <button
        className="btn-next"
        style={{ width: '100%', fontSize: '16px', height: '58px' }}
        onClick={() => navigate('/body')}
      >
        はじめる →
      </button>

    </div>
  )
}