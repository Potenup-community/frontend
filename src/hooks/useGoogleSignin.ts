'use client'

import { useGoogleLogin } from '@react-oauth/google'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

export function useGoogleSignin() {
  const router = useRouter()
  const { checkAuth } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const login = useGoogleLogin({
    flow: 'auth-code',
    scope: 'openid profile email',
    onSuccess: async ({ code }) => {
      setIsLoading(true)
      try {
        const res = await fetch('/api/auth/signin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
          cache: 'no-store',
        })

        if (res.status === 204 || res.ok) {
          await checkAuth()
          toast.success('로그인되었습니다!')
          // router 대신 window.location.href를 사용하여 세션을 새로고침하며 이동
          window.location.href = '/'
          return
        }

        const data = await res.json()
        
        // Handle 404 (User not found)
        if (res.status === 404) {
          if (data.idToken) {
            // Store idToken for signup
            sessionStorage.setItem('pendingIdToken', data.idToken)
            toast.info('회원가입이 필요합니다.')
            router.push('/signup')
          } else {
            toast.error('회원가입 정보를 찾을 수 없습니다.')
          }
        } else {
          toast.error(data.message || '로그인 중 오류가 발생했습니다.')
        }

      } catch (error) {
        console.error('Login error:', error)
        toast.error('로그인 중 오류가 발생했습니다.')
      } finally {
        setIsLoading(false)
      }
    },
    onError: (err) => {
      console.error('Google login failed', err)
      toast.error('Google 로그인에 실패했습니다.')
      setIsLoading(false)
    },
  })

  return {
    signWithGoogle: () => {
      setIsLoading(true)
      login()
    },
    isLoading,
  }
}
