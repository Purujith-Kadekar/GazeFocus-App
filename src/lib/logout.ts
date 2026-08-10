import { signOut } from 'next-auth/react'

/** Known app-specific localStorage/sessionStorage key prefixes that belong to GazeFocus. */
const APP_STORAGE_PREFIXES = ['settings-storage', 'ui-storage', 'gazefocus-']

/** NextAuth cookie names that should be cleared on logout. */
const NEXTAUTH_COOKIE_NAMES = [
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
  'next-auth.csrf-token',
  '__Secure-next-auth.csrf-token',
  'next-auth.callback-url',
  '__Secure-next-auth.callback-url',
]

function isAppKey(key: string): boolean {
  return APP_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))
}

export async function clearUserData() {
  // Only clear app-specific keys from localStorage
  const localStorageKeysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && isAppKey(key)) {
      localStorageKeysToRemove.push(key)
    }
  }
  localStorageKeysToRemove.forEach((key) => localStorage.removeItem(key))

  // Only clear app-specific keys from sessionStorage
  const sessionStorageKeysToRemove: string[] = []
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)
    if (key && isAppKey(key)) {
      sessionStorageKeysToRemove.push(key)
    }
  }
  sessionStorageKeysToRemove.forEach((key) => sessionStorage.removeItem(key))

  // Clear NextAuth cookies by name (not a blanket clear)
  NEXTAUTH_COOKIE_NAMES.forEach((name) => {
    // Try both with and without __Secure- prefix path variations
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;secure;samesite=lax`
  })

  await signOut({ redirect: true, callbackUrl: '/auth/login' })
}
