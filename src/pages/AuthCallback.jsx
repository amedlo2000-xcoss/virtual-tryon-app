import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      // URLハッシュからアクセストークンを取得してセッションを確立する
      const hash = window.location.hash
      if (hash && hash.includes('access_token')) {
        const params = new URLSearchParams(hash.slice(1))
        const accessToken  = params.get('access_token')
        const refreshToken = params.get('refresh_token')

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token:  accessToken,
            refresh_token: refreshToken,
          })
          if (error) {
            console.error('セッション確立エラー:', error.message)
          }
        }
      }

      navigate('/', { replace: true })
    }

    handleCallback()
  }, [navigate])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAF5F0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <p style={{ color: '#999', fontSize: '14px' }}>認証中...</p>
    </div>
  )
}
