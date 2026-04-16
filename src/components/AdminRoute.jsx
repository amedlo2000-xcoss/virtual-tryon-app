import { useEffect, useState, startTransition } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'

export default function AdminRoute() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [isAdmin, setIsAdmin] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (loading) return
    if (!user) {
      setChecking(false)
      startTransition(() => navigate('/admin-login', { replace: true }))
      return
    }
    supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data?.is_admin) {
          setIsAdmin(false)
          startTransition(() => navigate('/admin-login', { replace: true }))
        } else {
          setIsAdmin(true)
        }
        setChecking(false)
      })
  }, [user, loading, navigate])

  if (loading || checking) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#F7F5F2', zIndex: 9999,
      }}>
        <div style={{
          width: '44px', height: '44px',
          border: '4px solid #E8DDD5',
          borderTop: '4px solid #C8956C',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!isAdmin) return null

  return <Outlet />
}