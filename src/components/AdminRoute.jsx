import { useEffect, useState } from 'react'
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
      navigate('/admin-login', { replace: true })
      return
    }

    let cancelled = false
    const userId = user.id

    supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('AdminRoute error:', error)
          setIsAdmin(false)
          setChecking(false)
          navigate('/admin-login', { replace: true })
          return
        }
        if (!data || !data.is_admin) {
          setIsAdmin(false)
          setChecking(false)
          navigate('/admin-login', { replace: true })
          return
        }
        setIsAdmin(true)
        setChecking(false)
      })

    return () => { cancelled = true }
  }, [user?.id, loading])

  if (loading || checking) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#FAF5F0', zIndex: 9999,
      }}>
        <div style={{
          width: '44px', height: '44px',
          border: '4px solid #F5E6E8',
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