/**
 * 管理者ログインページ
 *
 * ── Supabase 事前設定（SQL Editor で実行）──────────────────────────────────
 *
 * -- profilesテーブルを作成（未作成の場合）
 * CREATE TABLE IF NOT EXISTS profiles (
 *   id            uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
 *   email         text,
 *   created_at    timestamptz DEFAULT now(),
 *   is_admin      boolean DEFAULT false,
 *   is_banned     boolean DEFAULT false,
 *   last_login_at timestamptz
 * );
 *
 * -- 既存テーブルへのカラム追加
 * ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin      boolean DEFAULT false;
 * ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned     boolean DEFAULT false;
 * ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at timestamptz;
 *
 * -- AI試着履歴テーブル（存在しない場合）
 * CREATE TABLE IF NOT EXISTS tryon_results (
 *   id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
 *   created_at timestamptz DEFAULT now()
 * );
 *
 * -- RLS有効化とポリシー設定
 * ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "users_own_profile_select"
 *   ON profiles FOR SELECT USING (auth.uid() = id);
 * CREATE POLICY "users_own_profile_update"
 *   ON profiles FOR UPDATE USING (auth.uid() = id);
 * CREATE POLICY "admin_all_profiles_select"
 *   ON profiles FOR SELECT
 *   USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
 * CREATE POLICY "admin_all_profiles_update"
 *   ON profiles FOR UPDATE
 *   USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
 *
 * -- 管理者ユーザーを設定する場合
 * UPDATE profiles SET is_admin = true WHERE email = 'your-admin@example.com';
 * ────────────────────────────────────────────────────────────────────────────
 */

import { useState, startTransition } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const INPUT_STYLE = {
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
}

export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Step 1: ログイン
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError('メールアドレスまたはパスワードが正しくありません。')
      setLoading(false)
      return
    }

    // Step 2: is_admin 確認
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('ユーザー情報の取得に失敗しました。')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.is_admin) {
      setError('管理者権限がありません。')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    // Step 3: last_login_at 更新
    await supabase
      .from('profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id)

    setLoading(false)
    startTransition(() => {
      navigate('/admin', { replace: true })
    })
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
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#333', letterSpacing: '0.05em', margin: 0 }}>
            Miron
          </h1>
          <p style={{ fontSize: '11px', color: '#C8956C', fontWeight: 700, letterSpacing: '0.15em', margin: '4px 0 0' }}>
            ADMIN CONSOLE
          </p>
        </div>

        {/* カード */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          padding: '32px 28px',
        }}>
          <h2 style={{
            fontSize: '18px', fontWeight: 700, color: '#333',
            marginBottom: '6px', textAlign: 'center',
          }}>
            管理者ログイン
          </h2>
          <p style={{ fontSize: '12px', color: '#bbb', textAlign: 'center', marginBottom: '24px' }}>
            管理者アカウントでログインしてください
          </p>

          {/* エラー */}
          {error && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '12px',
              marginBottom: '20px',
              fontSize: '13px',
              background: '#FEF2F2',
              color: '#B91C1C',
              border: '1px solid #FECACA',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off">
            {/* メール */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                fontSize: '12px', fontWeight: 600, color: '#888',
                display: 'block', marginBottom: '6px',
              }}>
                メールアドレス
              </label>
              <input
                id="admin-email"
                name="email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@example.com"
                style={INPUT_STYLE}
                onFocus={e => (e.target.style.borderColor = '#C8956C')}
                onBlur={e  => (e.target.style.borderColor = '#E8E0D8')}
              />
            </div>

            {/* パスワード */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{
                fontSize: '12px', fontWeight: 600, color: '#888',
                display: 'block', marginBottom: '6px',
              }}>
                パスワード
              </label>
              <input
                id="admin-password"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={INPUT_STYLE}
                onFocus={e => (e.target.style.borderColor = '#C8956C')}
                onBlur={e  => (e.target.style.borderColor = '#E8E0D8')}
              />
            </div>

            {/* ログインボタン */}
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
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255,255,255,0.4)',
                  borderTop: '2px solid #fff',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.8s linear infinite',
                }} />
              )}
              {loading ? '確認中...' : 'ログイン'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#ccc' }}>
          一般ユーザーの方は{' '}
          <a href="/auth" style={{ color: '#C8956C', textDecoration: 'none', fontWeight: 600 }}>
            こちら
          </a>
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
