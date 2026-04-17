import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import NavButtons from '../components/NavButtons'


const INPUT_STYLE = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '12px',
  border: '1.5px solid #E8D5D8',
  fontSize: '14px',
  color: '#333',
  background: '#FAFAFA',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
}

const LABEL_STYLE = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#888',
  display: 'block',
  marginBottom: '6px',
}

export default function MyPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    display_name: '',
    height: '',
    weight: '',
    bust: '',
    waist: '',
    hip: '',
    usual_size: '',
  })
  const [saving, setSaving] = useState(false)
  const [toast, setToast]   = useState(null)  // { type: 'success'|'error', text }

  // ユーザーメタデータからプロフィールを読み込む
  useEffect(() => {
    if (user?.user_metadata) {
      const m = user.user_metadata
      setForm({
        display_name: m.display_name ?? '',
        height:       m.height       ?? '',
        weight:       m.weight       ?? '',
        bust:         m.bust         ?? '',
        waist:        m.waist        ?? '',
        hip:          m.hip          ?? '',
        usual_size:   m.usual_size   ?? '',
      })
    }
  }, [user])

  const handleChange = (key) => (e) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ data: form })
    setSaving(false)
    if (error) {
      showToast('error', '保存に失敗しました: ' + error.message)
    } else {
      showToast('success', 'プロフィールを保存しました')
    }
  }

  const showToast = (type, text) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  const fields = [
    { key: 'display_name', label: 'ニックネーム', placeholder: '例：田中花子', type: 'text', unit: '' },
    { key: 'height',       label: '身長',         placeholder: '例：160',     type: 'number', unit: 'cm' },
    { key: 'weight',       label: '体重',          placeholder: '例：55',      type: 'number', unit: 'kg' },
    { key: 'bust',         label: 'バスト',        placeholder: '例：85',      type: 'number', unit: 'cm' },
    { key: 'waist',        label: 'ウエスト',      placeholder: '例：65',      type: 'number', unit: 'cm' },
    { key: 'hip',          label: 'ヒップ',        placeholder: '例：88',      type: 'number', unit: 'cm' },
    { key: 'usual_size',   label: 'いつものサイズ', placeholder: '例：M',       type: 'text', unit: '' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#FAF5F0', paddingBottom: '100px' }}>

      {/* ヘッダー */}
      <div style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #F0EAE3',
        padding: '20px 20px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#333', margin: 0 }}>
          マイページ
        </h1>
        <button
          onClick={handleSignOut}
          style={{
            background: 'none',
            border: '1px solid #ddd',
            borderRadius: '20px',
            padding: '6px 14px',
            fontSize: '12px',
            color: '#888',
            cursor: 'pointer',
          }}
        >
          ログアウト
        </button>
      </div>

      <div style={{ padding: '24px 20px', maxWidth: '480px', margin: '0 auto' }}>

        {/* アカウント情報 */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          padding: '20px',
          marginBottom: '16px',
        }}>
          <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>メールアドレス</p>
          <p style={{ fontSize: '14px', color: '#333', margin: '4px 0 0', fontWeight: 600 }}>
            {user?.email}
          </p>
        </div>

        {/* 友達紹介ボタン */}
        <button
          onClick={() => navigate('/referral')}
          style={{
            width: '100%',
            padding: '16px',
            background: 'linear-gradient(135deg, #F5E6E8, #FAF0E8)',
            border: '1.5px solid #E8D5D8',
            borderRadius: '20px',
            fontSize: '15px',
            fontWeight: 700,
            color: '#C9A96E',
            cursor: 'pointer',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: '0 2px 12px rgba(201,169,110,0.12)',
          }}
        >
          🎁 友達を紹介する
        </button>

        {/* プロフィール編集フォーム */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          padding: '24px 20px',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#333', margin: '0 0 20px' }}>
            プロフィール編集
          </h2>

          <form onSubmit={handleSave}>
            {/* ニックネーム（全幅） */}
            <div style={{ marginBottom: '16px' }}>
              <label style={LABEL_STYLE}>ニックネーム</label>
              <input
                type="text"
                value={form.display_name}
                onChange={handleChange('display_name')}
                placeholder="例：田中花子"
                style={INPUT_STYLE}
                onFocus={e => (e.target.style.borderColor = '#E8A0A8')}
                onBlur={e  => (e.target.style.borderColor = '#E8D5D8')}
              />
            </div>

            {/* 体型情報 2列グリッド */}
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#C9A96E', marginBottom: '12px', letterSpacing: '0.05em' }}>
              体型情報
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              {[
                { key: 'height',     label: '身長',     placeholder: '例：160', type: 'number', unit: 'cm' },
                { key: 'weight',     label: '体重',     placeholder: '例：55',  type: 'number', unit: 'kg' },
                { key: 'bust',       label: 'バスト',   placeholder: '例：85',  type: 'number', unit: 'cm' },
                { key: 'waist',      label: 'ウエスト', placeholder: '例：65',  type: 'number', unit: 'cm' },
                { key: 'hip',        label: 'ヒップ',   placeholder: '例：88',  type: 'number', unit: 'cm' },
                { key: 'usual_size', label: 'いつものサイズ', placeholder: '例：M', type: 'text', unit: '' },
              ].map(({ key, label, placeholder, type, unit }) => (
                <div key={key}>
                  <label style={LABEL_STYLE}>{label}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type={type}
                      value={form[key]}
                      onChange={handleChange(key)}
                      placeholder={placeholder}
                      style={INPUT_STYLE}
                      onFocus={e => (e.target.style.borderColor = '#E8A0A8')}
                      onBlur={e  => (e.target.style.borderColor = '#E8D5D8')}
                    />
                    {unit && (
                      <span style={{ fontSize: '12px', color: '#999', whiteSpace: 'nowrap' }}>
                        {unit}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                width: '100%',
                padding: '14px',
                background: saving ? '#DEC08A' : '#C9A96E',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '20px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background 0.2s',
              }}
            >
              {saving && (
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
              保存する
            </button>
          </form>
        </div>
      </div>

      {/* トースト通知 */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '90px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: toast.type === 'success' ? '#2D7D46' : '#B91C1C',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 600,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          zIndex: 1000,
          animation: 'fadeInUp 0.3s ease',
          whiteSpace: 'nowrap',
        }}>
          {toast.text}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      <NavButtons />
    </div>
  )
}
