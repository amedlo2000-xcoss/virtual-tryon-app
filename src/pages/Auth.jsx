import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'

export default function Auth() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode]       = useState('login')   // 'login' | 'signup'
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)   // { type: 'success'|'error', text }

  // ログイン済みならホームへリダイレクト
  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (mode === 'signup') {
      console.log('[Auth] signUp 開始:', email)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://virtual-tryon-app-phi.vercel.app/'
        }
      })
      console.log('[Auth] signUp 結果 data:', data, ' error:', error)

      if (error) {
        console.error('[Auth] signUp エラー:', error.message, error.status)
        setMessage({ type: 'error', text: `登録に失敗しました: ${error.message}` })
      } else if (data.session) {
        // メール確認不要（auto-confirm ON）→ そのままホームへ遷移
        console.log('[Auth] signUp 自動確認済み, user:', data.user?.id, '→ / へ遷移')
        navigate('/', { replace: true })
        return
      } else {
        // メール確認が必要 → 確認メッセージを表示
        console.log('[Auth] signUp メール確認待ち, user:', data.user?.id)
        setEmail('')
        setPassword('')
        setMessage({ type: 'success', text: '確認メールを送信しました。メールをご確認ください。' })
      }
    } else {
      console.log('[Auth] signIn 開始:', email)
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      console.log('[Auth] signIn 結果 data:', data, ' error:', error)

      if (error) {
        console.error('[Auth] signIn エラー:', error.message, error.status)
        let errorMsg
        const msg = error.message ?? ''
        if (msg.includes('Email not confirmed')) {
          errorMsg = 'メールアドレスの確認が完了していません。届いた確認メールのリンクをクリックしてください。'
        } else if (msg.includes('Invalid login credentials') || error.status === 400) {
          errorMsg = 'メールアドレスまたはパスワードが正しくありません。'
        } else if (msg.includes('Too many requests')) {
          errorMsg = 'リクエストが多すぎます。しばらく待ってから再度お試しください。'
        } else if (msg.includes('User not found')) {
          errorMsg = 'このメールアドレスは登録されていません。'
        } else {
          errorMsg = `ログインに失敗しました: ${msg}`
        }
        setMessage({ type: 'error', text: errorMsg })
      } else {
        console.log('[Auth] signIn 成功, user:', data.user?.id, '→ / へ遷移')
        navigate('/', { replace: true })
      }
    }

    setLoading(false)
  }

  const toggleMode = () => {
    setMode(m => m === 'login' ? 'signup' : 'login')
    setMessage(null)
    setEmail('')
    setPassword('')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F7F5F2',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* ロゴ */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#333', letterSpacing: '0.05em' }}>
            Miron
          </h1>
          <p style={{ fontSize: '12px', color: '#C8956C', fontWeight: 600, letterSpacing: '0.1em' }}>
            VIRTUAL TRY-ON
          </p>
        </div>

        {/* カード */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          padding: '32px 28px',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#333', marginBottom: '24px', textAlign: 'center' }}>
            {mode === 'login' ? 'ログイン' : '新規登録'}
          </h2>

          {/* メッセージ */}
          {message && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '12px',
              marginBottom: '20px',
              fontSize: '13px',
              background: message.type === 'success' ? '#F0FAF4' : '#FEF2F2',
              color:      message.type === 'success' ? '#2D7D46' : '#B91C1C',
              border:     `1px solid ${message.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
            }}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* メール */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#888', display: 'block', marginBottom: '6px' }}>
                メールアドレス
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="example@email.com"
                autoComplete="off"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1.5px solid #E8E0D8',
                  fontSize: '14px',
                  color: '#333',
                  background: '#FAFAFA',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#C8956C'}
                onBlur={e  => e.target.style.borderColor = '#E8E0D8'}
              />
            </div>

            {/* パスワード */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#888', display: 'block', marginBottom: '6px' }}>
                パスワード
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="6文字以上"
                autoComplete="new-password"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1.5px solid #E8E0D8',
                  fontSize: '14px',
                  color: '#333',
                  background: '#FAFAFA',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#C8956C'}
                onBlur={e  => e.target.style.borderColor = '#E8E0D8'}
              />
            </div>

            {/* 送信ボタン */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading ? '#D9B89A' : '#C8956C',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '20px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {loading && (
                <span style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255,255,255,0.4)',
                  borderTop: '2px solid #fff',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.8s linear infinite',
                }} />
              )}
              {mode === 'login' ? 'ログイン' : '登録する'}
            </button>
          </form>

          {/* モード切替 */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <span style={{ fontSize: '13px', color: '#999' }}>
              {mode === 'login' ? 'アカウントをお持ちでない方は' : 'すでにアカウントをお持ちの方は'}
            </span>
            <button
              onClick={toggleMode}
              style={{
                background: 'none',
                border: 'none',
                color: '#C8956C',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                marginLeft: '4px',
                padding: 0,
              }}
            >
              {mode === 'login' ? '新規登録' : 'ログイン'}
            </button>
          </div>
        </div>

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
