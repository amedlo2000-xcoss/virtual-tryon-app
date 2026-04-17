import { useEffect, useState, startTransition } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'

export default function AdminRoute() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [isAdmin, setIsAdmin] = useState(null)
  const [checking, setChecking] = useState(true)

  const userId = user?.id ?? null

  useEffect(() => {
    if (loading) return
    if (!userId) {
      setChecking(false)
      startTransition(() => navigate('/admin-login', { replace: true }))
      return
    }
    let cancelled = false
    supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error || !data?.is_admin) {
          setIsAdmin(false)
          startTransition(() => navigate('/admin-login', { replace: true }))
        } else {
          setIsAdmin(true)
        }
        setChecking(false)
      })
    return () => { cancelled = true }
  }, [userId, loading]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || checking) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#FAF5F0', zIndex: 9999,
      }}>
        <div style={{
          width: '44px', height: '44px',
          border: '4px solid #E8DDD5',
          borderTop: '4px solid #E8A0A8',
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