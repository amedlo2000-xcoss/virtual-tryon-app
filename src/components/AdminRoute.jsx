import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'

function Spinner() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
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
  )
}

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
          navigate('/admin-login', { replace: true })
        } else if (!data?.is_admin) {
          setIsAdmin(false)
          navigate('/admin-login', { replace: true })
        } else {
          setIsAdmin(true)
        }
        setChecking(false)
      })
  }, [user, navigate])

  if (checking) return <Spinner />
  if (!isAdmin) return null
  return <Outlet />
}
