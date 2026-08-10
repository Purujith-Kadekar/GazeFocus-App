'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
} from 'firebase/auth'
import { auth as firebaseAuth } from '@/lib/firebase'

function ExtensionOAuthContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'authenticating' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const provider = searchParams.get('provider') || 'google'
    const redirectUri = searchParams.get('redirect_uri')

    if (!redirectUri) {
      setStatus('error')
      setErrorMessage('Missing redirect_uri parameter. This page is only for the Chrome extension.')
      return
    }

    // Auto-initiate the OAuth flow
    handleOAuthLogin(provider, redirectUri)
  }, [searchParams])

  async function handleOAuthLogin(provider: string, redirectUri: string) {
    setStatus('authenticating')

    try {
      // Create the Firebase auth provider
      let authProvider: any

      switch (provider) {
        case 'google':
          authProvider = new GoogleAuthProvider()
          break
        case 'github':
          authProvider = new GithubAuthProvider()
          break
        case 'twitter':
          authProvider = new OAuthProvider('twitter.com')
          break
        default:
          authProvider = new GoogleAuthProvider()
      }

      // Sign in with Firebase popup
      const result = await signInWithPopup(firebaseAuth, authProvider)
      const user = result.user

      // Get the ID token
      const idToken = await user.getIdToken()

      // Exchange the Firebase ID token for our app's JWT via /api/auth/firebase-login
      const response = await fetch('/api/auth/firebase-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })

      const data = await response.json()

      if (!data.success || !data.token) {
        setStatus('error')
        setErrorMessage(data.error || data.message || 'Failed to get authentication token')
        return
      }

      setStatus('success')

      // Build the redirect URL with the token
      const userStr = encodeURIComponent(JSON.stringify({
        id: data.user?.id || user.uid,
        email: data.user?.email || user.email,
        name: data.user?.name || user.displayName,
        image: data.user?.image || user.photoURL,
      }))

      const callbackUrl = `${redirectUri}?token=${encodeURIComponent(data.token)}&user=${userStr}&expiresAt=${data.expiresAt || ''}`

      // Redirect back to the extension
      window.location.href = callbackUrl
    } catch (err: any) {
      console.error('[Extension OAuth] Error:', err)
      setStatus('error')
      setErrorMessage(err?.message || 'Authentication failed')

      // If the error is because the popup was closed, redirect back with error
      if (redirectUri && (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request')) {
        window.location.href = `${redirectUri}?error=${encodeURIComponent('Sign-in was cancelled')}`
      }
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0C0A07',
      color: '#F2EDE4',
      fontFamily: 'Fira Mono, monospace',
      fontSize: '14px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 400, padding: 32 }}>
        {/* Logo */}
        <svg width="48" height="48" viewBox="0 0 64 64" fill="none" style={{ margin: '0 auto 16px' }}>
          <ellipse cx="32" cy="32" rx="28" ry="17" stroke="#D4870A" strokeWidth="1.5"/>
          <circle cx="32" cy="32" r="8" fill="#0C0A07" stroke="#D4870A" strokeWidth="1.5"/>
          <circle cx="35" cy="29" r="2" fill="#D4870A" opacity="0.7"/>
        </svg>

        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 600, marginBottom: 8, color: '#D4870A' }}>
          GazeFocus
        </h1>

        {status === 'loading' && (
          <p style={{ color: '#B8A888' }}>Preparing sign-in...</p>
        )}

        {status === 'authenticating' && (
          <>
            <p style={{ color: '#B8A888' }}>Signing in with {(searchParams.get('provider') || 'google').charAt(0).toUpperCase() + (searchParams.get('provider') || 'google').slice(1)}...</p>
            <div style={{ marginTop: 16, width: 32, height: 32, border: '3px solid rgba(212,135,10,0.2)', borderTopColor: '#D4870A', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '16px auto 0' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </>
        )}

        {status === 'success' && (
          <p style={{ color: '#34A853' }}>Sign-in successful! Redirecting back to extension...</p>
        )}

        {status === 'error' && (
          <>
            <p style={{ color: '#E74C3C', marginBottom: 12 }}>{errorMessage}</p>
            <p style={{ color: '#B8A888', fontSize: 12 }}>
              You can close this tab and try again from the extension.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default function ExtensionOAuthPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0C0A07',
        color: '#B8A888',
        fontFamily: 'Fira Mono, monospace',
      }}>
        Loading...
      </div>
    }>
      <ExtensionOAuthContent />
    </Suspense>
  )
}
