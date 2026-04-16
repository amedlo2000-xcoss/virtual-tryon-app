import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'

export default function AdminRoute() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isAdmin, setIsAdmin] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/admin-login', { replace: true })
      setChecking(false)
      return
    }
    supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('AdminRoute: profiles取得エラー', error)
          setIsAdmin(false)
          // signOut は呼ばない — /admin-login にリダイレクトするだけ
          navigate('/admin-login', { replace: true })
        } else if (!data?.is_admin) {
          setIsAdmin(false)
          // signOut は呼ばない — /admin-login にリダイレクトするだけ
          navigate('/admin-login', { replace: true })
        } else {
          setIsAdmin(true)
        }
        setChecking(false)
      })
  }, [user, navigate])

  // insertBefore エラーを防ぐため、条件分岐でアンマウントせず display:none で制御する
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* ローディングスピナー */}
      <div style={{
        display: checking ? 'flex' : 'none',
        position: 'fixed',
        inset: 0,
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F7F5F2',
        zIndex: 9999,
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          border: '4px solid #E8DDD5',
          borderTop: '4px solid #C8956C',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>

      {/* 管理者コンテンツ */}
      <div style={{ display: (!checking && isAdmin) ? 'block' : 'none' }}>
        <Outlet />
      </div>
    </div>
  )
}
