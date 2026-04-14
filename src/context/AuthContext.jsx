import { createContext, useContext, useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { supabase } from '../supabase'

const AuthContext = createContext(null)

function clearSupabaseStorage() {
  Object.keys(localStorage)
    .filter(key => key.startsWith('sb-') || key.includes('supabase'))
    .forEach(key => localStorage.removeItem(key))
}

async function forceSignOut(setUser) {
  clearSupabaseStorage()
  try {
    await supabase.auth.signOut()
  } catch (_) {
    // signOut itself may fail if token is already invalid — ignore
  }
  flushSync(() => setUser(null))
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthContext] onAuthStateChange event:', event, 'user:', session?.user?.id ?? null)
      if (
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'INITIAL_SESSION'
      ) {
        setUser(session?.user ?? null)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('[AuthContext] getSession user:', session?.user?.id ?? null, 'error:', error?.message ?? null)
      if (error) {
        const msg = error.message ?? ''
        if (
          msg.includes('Refresh Token') ||
          msg.includes('refresh_token') ||
          msg.includes('Invalid Refresh Token') ||
          msg.includes('token is expired')
        ) {
          forceSignOut(setUser)
        } else {
          setUser(null)
        }
      } else {
        setUser(session?.user ?? null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await forceSignOut(setUser)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
