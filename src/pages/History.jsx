import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import NavButtons from '../components/NavButtons'

export default function History() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalUrl, setModalUrl] = useState(null)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const { data, error } = await supabase
        .from('tryon_sessions')
        .select('id, result_url, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (!error) setSessions(data ?? [])
      setLoading(false)
    })()
  }, [user])

  const formatDate = (iso) => {
    const d = new Date(iso)
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
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
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#333', margin: 0 }}>試着履歴</h1>
      </div>

      <div className="page-content-wrapper">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{
              width: '36px', height: '36px',
              border: '3px solid #E8DDD5',
              borderTop: '3px solid #E8A0A8',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        ) : sessions.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#bbb',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👗</div>
            <p style={{ fontSize: '15px', fontWeight: 600 }}>まだ試着履歴がありません</p>
            <p style={{ fontSize: '13px', marginTop: '8px' }}>AIバーチャル試着を始めてみましょう！</p>
            <button
              onClick={() => navigate('/upload-user')}
              style={{
                marginTop: '24px',
                padding: '12px 32px',
                background: '#E8A0A8',
                color: '#fff',
                border: 'none',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              試着してみる
            </button>
          </div>
        ) : (
          <div className="history-grid" style={{ display: 'grid', gap: '12px' }}>
            {sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => setModalUrl(s.result_url)}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                  cursor: 'pointer',
                  transition: 'transform 0.15s',
                }}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
                onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.97)')}
                onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <div style={{ aspectRatio: '3/4', overflow: 'hidden', background: '#F5F0EC' }}>
                  {s.result_url ? (
                    <img
                      src={s.result_url}
                      alt="試着結果"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#ccc', fontSize: '12px',
                    }}>
                      画像なし
                    </div>
                  )}
                </div>
                <div style={{ padding: '8px 10px' }}>
                  <p style={{ fontSize: '11px', color: '#aaa', margin: 0 }}>{formatDate(s.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 拡大モーダル */}
      {modalUrl && (
        <div
          onClick={() => setModalUrl(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '360px', width: '100%' }}>
            <button
              onClick={() => setModalUrl(null)}
              style={{
                position: 'absolute', top: '-40px', right: '0',
                background: 'none', border: 'none',
                color: '#fff', fontSize: '28px', cursor: 'pointer', lineHeight: 1,
              }}
            >
              ×
            </button>
            <img
              src={modalUrl}
              alt="試着結果"
              style={{
                width: '100%',
                borderRadius: '20px',
                aspectRatio: '3/4',
                objectFit: 'cover',
              }}
            />
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <NavButtons />
    </div>
  )
}
