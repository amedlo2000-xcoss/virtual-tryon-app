import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [newPassword, setNewPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading]             = useState(false)
  const [message, setMessage]             = useState(null)  // { type: 'success'|'error', text }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage(null)

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'パスワードが一致しません。もう一度確認してください。' })
      return
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'パスワードは6文字以上で入力してください。' })
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      const msg = error.message ?? ''
      let errorMsg
      if (msg.includes('same password') || msg.includes('different')) {
        errorMsg = '現在と異なるパスワードを設定してください。'
      } else if (msg.includes('Auth session missing') || msg.includes('session')) {
        errorMsg = 'セッションが無効です。再度パスワードリセットメールからお試しください。'
      } else if (msg.includes('weak password') || msg.includes('Password')) {
        errorMsg = 'パスワードが弱すぎます。英数字を組み合わせた6文字以上のパスワードを設定してください。'
      } else {
        errorMsg = `パスワードの変更に失敗しました: ${msg}`
      }
      setMessage({ type: 'error', text: errorMsg })
      setLoading(false)
      return
    }

    setMessage({ type: 'success', text: 'パスワードを変更しました' })
    setTimeout(() => navigate('/auth', { replace: true }), 1500)
    setLoading(false)
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
            新しいパスワードを設定
          </h2>

          {/* メッセージ */}
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

          <form onSubmit={handleSubmit}>
            {/* 新しいパスワード */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#888', display: 'block', marginBottom: '6px' }}>
                新しいパスワード
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
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

            {/* 確認用パスワード */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#888', display: 'block', marginBottom: '6px' }}>
                パスワードの確認
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="もう一度入力してください"
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
              パスワードを変更する
            </button>
          </form>
        </div>

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
