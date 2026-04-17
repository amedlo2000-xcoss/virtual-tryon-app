import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NavButtons from '../components/NavButtons'

const SHARE_TEXT = 'Mironで試着してみて！着た自分を、買う前に確認できるよ✨'
const APP_URL = 'https://virtual-tryon-app-phi.vercel.app'

export default function Referral() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  const referralUrl = `${APP_URL}/?ref=${user?.id ?? ''}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // フォールバック
      const el = document.createElement('textarea')
      el.value = referralUrl
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const handleLineShare = () => {
    const text = encodeURIComponent(`${SHARE_TEXT}\n${referralUrl}`)
    window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(referralUrl)}&text=${text}`, '_blank')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF5F0', paddingBottom: '100px' }}>

      <div style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #F0EAE3',
        padding: '20px 20px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', padding: '0', color: '#888' }}
        >
          ←
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#333', margin: 0 }}>友達を紹介する</h1>
      </div>

      <div className="page-content-wrapper">

        {/* ヒーローセクション */}
        <div style={{
          background: 'linear-gradient(135deg, #F5E6E8 0%, #FAF0E8 100%)',
          borderRadius: '20px',
          padding: '32px 24px',
          textAlign: 'center',
          marginBottom: '24px',
          boxShadow: '0 2px 12px rgba(232,160,168,0.15)',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎁</div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#333', margin: '0 0 8px' }}>
            Mironを広めよう
          </h2>
          <p style={{ fontSize: '14px', color: '#888', lineHeight: 1.7, margin: 0 }}>
            {SHARE_TEXT}
          </p>
        </div>

        {/* 紹介URL */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#C9A96E', margin: '0 0 10px', letterSpacing: '0.05em' }}>
            あなたの紹介URL
          </p>
          <div style={{
            background: '#FAF5F0',
            borderRadius: '12px',
            padding: '12px 14px',
            marginBottom: '12px',
            wordBreak: 'break-all',
            fontSize: '12px',
            color: '#666',
            border: '1.5px solid #F0EAE3',
          }}>
            {referralUrl}
          </div>

          <button
            onClick={handleCopy}
            style={{
              width: '100%',
              padding: '14px',
              background: copied ? '#2D7D46' : '#C9A96E',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '20px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {copied ? '✓ コピーしました！' : '📋 URLをコピーする'}
          </button>
        </div>

        {/* シェアボタン */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#888', margin: '0 0 12px', letterSpacing: '0.05em' }}>
            SNSでシェアする
          </p>
          <button
            onClick={handleLineShare}
            style={{
              width: '100%',
              padding: '14px',
              background: '#06C755',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '20px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 2C6.03 2 2 5.63 2 10.08c0 3.99 3.54 7.33 8.33 7.94l.36.05v2.43c0 .29.33.44.55.26l3.3-2.69c2.9-.87 5-3.23 5-5.99C19.54 5.63 15.97 2 11 2z" fill="#fff"/>
            </svg>
            LINEで友達に送る
          </button>
        </div>
      </div>

      <NavButtons />
    </div>
  )
}
