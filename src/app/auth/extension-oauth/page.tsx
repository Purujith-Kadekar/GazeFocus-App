'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
} from 'firebase/auth'
import { auth as firebaseAuth } from '@/lib/firebase'

/**
 * Extension OAuth bridge.
 *
 * The Chrome extension opens this page via chrome.identity.launchWebAuthFlow.
 *
 * Three paths, all ending in the same handoff:
 *
 *  A. Not signed in     -> "Continue with <provider>" click -> Firebase
 *     signInWithPopup (the webapp's own Firebase project — no separate OAuth
 *     client or env vars) -> exchange ID token -> redirect with ?token=...
 *
 *  B. Already signed in -> explicit CONSENT SCREEN: "The GazeFocus extension
 *     is requesting access to your account (email)". The user clicks
 *     "Grant access" (one click, no password) -> fresh ID token from the
 *     existing session -> exchange -> redirect with ?token=...   Or they can
 *     pick "Use a different account" (signs out first).
 *
 *     The explicit click is REQUIRED, not cosmetic: an attacker who crafts
 *     this URL with their own extension's chromiumapp.org callback could
 *     otherwise silently harvest the JWT of any signed-in user who visits
 *     the link. The click is the consent step, same as any OAuth screen.
 *
 *  C. Signed in with a different account than wanted -> "Use a different
 *     account" -> signOut -> falls back to path A.
 *
 * Additional hard requirements this page enforces:
 *  1. Sign-in always starts from a real user click (auto-firing
 *     signInWithPopup on load gets the popup blocked in the
 *     launchWebAuthFlow window).
 *  2. The redirect_uri must be the extension's chromiumapp.org identity
 *     callback — otherwise this page is an open redirect that leaks the JWT.
 */

// chrome.identity.getRedirectURL() format: https://<32-char-extension-id>.chromiumapp.org/
const CHROMIUMAPP_REDIRECT = /^https:\/\/[a-p]{32}\.chromiumapp\.org\/?$/

const SESSION_CHECK_TIMEOUT_MS = 3000

/**
 * Map raw Firebase errors to actionable messages. The network error in
 * particular is almost always a blocker (uBlock/Brave shields frequently
 * filter Google auth domains) or a captive portal / offline machine — the
 * raw "Firebase: Error (auth/network-request-failed)" tells the user
 * nothing.
 */
function friendlyAuthError(err: any): string {
  switch (err?.code) {
    case 'auth/network-request-failed':
      return 'A network request to Google\'s sign-in servers was blocked or failed. Check your internet connection, and if you use an ad-blocker, VPN, or browser like Brave with shields, allow the following domains for this page: identitytoolkit.googleapis.com, securetoken.googleapis.com, accounts.google.com — then retry.'
    case 'auth/popup-blocked':
      return 'The sign-in popup was blocked. Click "Continue with Google" once more — the click itself allows the popup to open.'
    case 'auth/operation-not-allowed':
      return 'This sign-in provider is not enabled for the GazeFocus Firebase project. Enable it in the Firebase console (Authentication → Sign-in method).'
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized in the Firebase project (Authentication → Settings → Authorized domains).'
    default:
      return err?.message || 'Authentication failed'
  }
}

interface ExistingSession {
  email: string | null
  name: string | null
  image: string | null
}

function ExtensionOAuthContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'checking' | 'confirm' | 'ready' | 'authenticating' | 'success' | 'error'>('checking')
  const [errorMessage, setErrorMessage] = useState('')
  const [redirectUri, setRedirectUri] = useState('')
  const [provider, setProvider] = useState('google')
  const [existing, setExisting] = useState<ExistingSession | null>(null)

  useEffect(() => {
    const requestedProvider = searchParams.get('provider') || 'google'
    const requestedRedirect = searchParams.get('redirect_uri')

    setProvider(requestedProvider)

    if (!requestedRedirect) {
      setStatus('error')
      setErrorMessage('Missing redirect_uri parameter. This page is only for the GazeFocus extension.')
      return
    }

    if (!CHROMIUMAPP_REDIRECT.test(requestedRedirect)) {
      setStatus('error')
      setErrorMessage('Invalid redirect_uri. Only the extension identity callback is allowed.')
      return
    }

    setRedirectUri(requestedRedirect)

    // Detect an existing webapp session (Firebase restores persistence
    // asynchronously — authStateReady resolves once the initial state is
    // known; fall back to the sign-in path after a short timeout).
    let settled = false
    const finish = (user: ExistingSession | null) => {
      if (settled) return
      settled = true
      if (user) {
        setExisting(user)
        setStatus('confirm')
      } else {
        setStatus('ready')
      }
    }

    firebaseAuth.authStateReady().then(() => {
      const user = firebaseAuth.currentUser
      finish(user ? { email: user.email, name: user.displayName, image: user.photoURL } : null)
    }).catch(() => finish(null))

    const timeout = setTimeout(() => finish(null), SESSION_CHECK_TIMEOUT_MS)
    return () => clearTimeout(timeout)
  }, [searchParams])

  const redirectWithError = useCallback((message: string) => {
    window.location.href = `${redirectUri}?error=${encodeURIComponent(message)}`
  }, [redirectUri])

  const exchangeAndRedirect = useCallback(async (idToken: string, fallbackUser: { uid: string; email: string | null; displayName: string | null; photoURL: string | null }) => {
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

    const userStr = encodeURIComponent(JSON.stringify({
      id: data.user?.id || fallbackUser.uid,
      email: data.user?.email || fallbackUser.email,
      name: data.user?.name || fallbackUser.displayName,
      image: data.user?.image || fallbackUser.photoURL,
    }))

    const callbackUrl =
      `${redirectUri}?token=${encodeURIComponent(data.token)}` +
      `&user=${userStr}&expiresAt=${data.expiresAt || ''}`

    window.location.href = callbackUrl
  }, [redirectUri])

  /** Path B: grant the extension access to the CURRENT signed-in account. */
  const handleGrantAccess = useCallback(async () => {
    if (!redirectUri || !firebaseAuth.currentUser) return
    setStatus('authenticating')
    try {
      // Force a fresh ID token from the existing session.
      const idToken = await firebaseAuth.currentUser.getIdToken(true)
      await exchangeAndRedirect(idToken, firebaseAuth.currentUser)
    } catch (err: any) {
      console.error('[Extension OAuth] Grant failed:', err)
      setStatus('error')
      setErrorMessage(friendlyAuthError(err))
    }
  }, [redirectUri, exchangeAndRedirect])

  /** Path C: sign out of the current account, then fall back to path A. */
  const handleSwitchAccount = useCallback(async () => {
    try {
      await signOut(firebaseAuth)
    } catch {
      // Even if sign-out hiccups, the popup flow will show the chooser.
    }
    setExisting(null)
    setStatus('ready')
  }, [])

  /** Path A: interactive provider sign-in. */
  const handleOAuthLogin = useCallback(async () => {
    if (!redirectUri) return
    setStatus('authenticating')

    try {
      let authProvider: any
      switch (provider) {
        case 'github':
          authProvider = new GithubAuthProvider()
          break
        case 'twitter':
          authProvider = new OAuthProvider('twitter.com')
          break
        default:
          authProvider = new GoogleAuthProvider()
      }

      // The user just clicked, so this window has activation — the
      // provider popup is allowed to open.
      const result = await signInWithPopup(firebaseAuth, authProvider)
      const user = result.user
      const idToken = await user.getIdToken()

      await exchangeAndRedirect(idToken, user)
    } catch (err: any) {
      console.error('[Extension OAuth] Error:', err)

      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        redirectWithError('Sign-in was cancelled')
        return
      }

      setStatus('error')
      setErrorMessage(friendlyAuthError(err))
    }
  }, [provider, redirectUri, redirectWithError, exchangeAndRedirect])

  const providerLabel = provider.charAt(0).toUpperCase() + provider.slice(1)

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
      <div style={{ textAlign: 'center', maxWidth: 420, padding: 32 }}>
        {/* Logo */}
        <svg width="48" height="48" viewBox="0 0 64 64" fill="none" style={{ margin: '0 auto 16px' }}>
          <ellipse cx="32" cy="32" rx="28" ry="17" stroke="#D4870A" strokeWidth="1.5"/>
          <circle cx="32" cy="32" r="8" fill="#0C0A07" stroke="#D4870A" strokeWidth="1.5"/>
          <circle cx="35" cy="29" r="2" fill="#D4870A" opacity="0.7"/>
        </svg>

        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 600, marginBottom: 8, color: '#D4870A' }}>
          GazeFocus
        </h1>

        {status === 'checking' && (
          <p style={{ color: '#B8A888' }}>Checking your session...</p>
        )}

        {status === 'confirm' && existing && (
          <>
            <p style={{ color: '#F2EDE4', marginBottom: 4 }}>
              The <strong>GazeFocus extension</strong> is requesting
            </p>
            <p style={{ color: '#B8A888', marginBottom: 20 }}>access to your account</p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              justifyContent: 'center',
              padding: '10px 14px',
              border: '1px solid rgba(212,135,10,0.22)',
              borderRadius: 10,
              background: 'rgba(212,135,10,0.06)',
              marginBottom: 20,
            }}>
              {existing.image ? (
                <img src={existing.image} alt="" width={32} height={32} style={{ borderRadius: '50%' }} />
              ) : (
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'rgba(212,135,10,0.2)', color: '#D4870A',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700,
                }}>
                  {(existing.name || existing.email || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{existing.name || 'Signed-in user'}</div>
                <div style={{ color: '#B8A888', fontSize: 12 }}>{existing.email}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleGrantAccess}
                style={{
                  background: '#D4870A',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '12px 24px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Grant access
              </button>
              <button
                onClick={handleSwitchAccount}
                style={{
                  background: 'transparent',
                  color: '#B8A888',
                  border: '1px solid rgba(212,135,10,0.22)',
                  borderRadius: 8,
                  padding: '12px 20px',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Use a different account
              </button>
            </div>

            <p style={{ color: '#A89878', fontSize: 11, marginTop: 16 }}>
              Granting lets the extension use your GazeFocus account (library,
              progress, settings). You can revoke by signing out in the extension.
            </p>
          </>
        )}

        {status === 'ready' && (
          <>
            <p style={{ color: '#B8A888', marginBottom: 20 }}>
              Sign in to connect the extension with your account.
            </p>
            <button
              onClick={handleOAuthLogin}
              style={{
                background: '#D4870A',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '12px 28px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Continue with {providerLabel}
            </button>
          </>
        )}

        {status === 'authenticating' && (
          <>
            <p style={{ color: '#B8A888' }}>Signing in with {providerLabel}...</p>
            <div style={{ marginTop: 16, width: 32, height: 32, border: '3px solid rgba(212,135,10,0.2)', borderTopColor: '#D4870A', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '16px auto 0' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </>
        )}

        {status === 'success' && (
          <p style={{ color: '#34A853' }}>Access granted! Redirecting back to extension...</p>
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
