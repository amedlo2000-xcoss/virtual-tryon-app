import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabase'

const AuthContext = createContext(null)

const fullScreenSpinner = (
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
      animation: 'auth-spin 0.8s linear infinite',
    }} />
    <style>{`@keyframes auth-spin { to { transform: rotate(360deg); } }`}</style>
  </div>
)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // onAuthStateChange が getSession より先に発火する場合も loading を解除する
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = () => supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {loading ? fullScreenSpinner : children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
