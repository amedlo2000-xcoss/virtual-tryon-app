import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'

export default function Auth() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode]       = useState('login')   // 'login' | 'signup' | 'forgot'
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
        const msg = error.message ?? ''
        if (msg.includes('User already registered') || msg.includes('already registered')) {
          setMessage({ type: 'error', text: 'このメールアドレスはすでに登録されています。ログインしてください。' })
          setMode('login')
          setPassword('')
        } else {
          setMessage({ type: 'error', text: `登録に失敗しました: ${msg}` })
        }
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

  const handleForgot = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://virtual-tryon-app-phi.vercel.app/reset-password'
    })

    if (error) {
      const msg = error.message ?? ''
      let errorMsg
      if (msg.includes('rate limit') || msg.includes('Too many')) {
        errorMsg = 'リクエストが多すぎます。しばらく待ってから再度お試しください。'
      } else if (msg.includes('invalid') || msg.includes('Invalid')) {
        errorMsg = 'メールアドレスの形式が正しくありません。'
      } else {
        errorMsg = `送信に失敗しました: ${msg}`
      }
      setMessage({ type: 'error', text: errorMsg })
    } else {
      setMessage({ type: 'success', text: 'パスワードリセットメールを送信しました。メールをご確認ください。' })
      setEmail('')
    }

    setLoading(false)
  }

  const toggleMode = () => {
    setMode(m => m === 'login' ? 'signup' : 'login')
    setMessage(null)
    setEmail('')
    setPassword('')
  }

  const goToForgot = () => {
    setMode('forgot')
    setMessage(null)
    setEmail('')
    setPassword('')
  }

  const goToLogin = () => {
    setMode('login')
    setMessage(null)
    setEmail('')
    setPassword('')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAF5F0',
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
          <p style={{ fontSize: '12px', color: '#E8A0A8', fontWeight: 600, letterSpacing: '0.1em' }}>
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
            {mode === 'login' ? 'ログイン' : mode === 'signup' ? '新規登録' : 'パスワードをリセット'}
          </h2>

          {/* メッセージ (display:none方式でDOM安定) */}
          <div style={{
            display: message ? 'block' : 'none',
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '20px',
            fontSize: '13px',
            background: message?.type === 'success' ? '#F0FAF4' : '#FEF2F2',
            color:      message?.type === 'success' ? '#2D7D46' : '#B91C1C',
            border:     `1px solid ${message?.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
          }}>
            {message?.text ?? ''}
          </div>

          {/* ログイン・新規登録フォーム */}
          {mode !== 'forgot' && (
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
                  onFocus={e => e.target.style.borderColor = '#E8A0A8'}
                  onBlur={e  => e.target.style.borderColor = '#E8E0D8'}
                />
              </div>

              {/* パスワード */}
              <div style={{ marginBottom: '8px' }}>
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
                  onFocus={e => e.target.style.borderColor = '#E8A0A8'}
                  onBlur={e  => e.target.style.borderColor = '#E8E0D8'}
                />
              </div>

              {/* パスワード忘れリンク（ログイン時のみ） */}
              {mode === 'login' && (
                <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                  <button
                    type="button"
                    onClick={goToForgot}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#E8A0A8',
                      fontSize: '12px',
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'none',
                    }}
                  >
                    パスワードをお忘れの方はこちら
                  </button>
                </div>
              )}
              {mode === 'signup' && <div style={{ marginBottom: '20px' }} />}

              {/* 送信ボタン */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: loading ? '#F0C4C8' : '#E8A0A8',
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
                <span style={{
                  display: loading ? 'inline-block' : 'none',
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255,255,255,0.4)',
                  borderTop: '2px solid #fff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
                {mode === 'login' ? 'ログイン' : '登録する'}
              </button>
            </form>
          )}

          {/* パスワードリセットフォーム */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgot}>
              <div style={{ marginBottom: '24px' }}>
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
                  onFocus={e => e.target.style.borderColor = '#E8A0A8'}
                  onBlur={e  => e.target.style.borderColor = '#E8E0D8'}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: loading ? '#F0C4C8' : '#E8A0A8',
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
                <span style={{
                  display: loading ? 'inline-block' : 'none',
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255,255,255,0.4)',
                  borderTop: '2px solid #fff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
                リセットメールを送信する
              </button>
            </form>
          )}

          {/* モード切替・ナビゲーション */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            {mode === 'forgot' ? (
              <button
                onClick={goToLogin}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#E8A0A8',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                ログインに戻る
              </button>
            ) : (
              <>
                <span style={{ fontSize: '13px', color: '#999' }}>
                  {mode === 'login' ? 'アカウントをお持ちでない方は' : 'すでにアカウントをお持ちの方は'}
                </span>
                <button
                  onClick={toggleMode}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#E8A0A8',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    marginLeft: '4px',
                    padding: 0,
                  }}
                >
                  {mode === 'login' ? '新規登録' : 'ログイン'}
                </button>
              </>
            )}
          </div>
        </div>

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
