import { signOut } from 'next-auth/react'

export async function clearUserData() {
  localStorage.clear()
  sessionStorage.clear()
  
  const cookies = document.cookie.split(';')
  for (let cookie of cookies) {
    const name = cookie.trim().split('=')[0]
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`
  }
  
  await signOut({ redirect: true, callbackUrl: '/auth/login' })
}