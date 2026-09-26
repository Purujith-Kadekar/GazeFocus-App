import { cert, initializeApp, getApps } from 'firebase-admin/app'
import { getAuth as getFirebaseAdminAuth } from 'firebase-admin/auth'

let serviceAccount: Record<string, unknown> = {}
let firebaseAdminInitialized = false
try {
  const jsonStr = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (jsonStr) {
    serviceAccount = JSON.parse(jsonStr)
  }
} catch (e) {
  console.error('[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', e instanceof Error ? e.message : String(e))
}

let app: ReturnType<typeof initializeApp> | undefined
let auth: ReturnType<typeof getFirebaseAdminAuth> | undefined

try {
  const existingApps = getApps()
  
  if (!existingApps.length && serviceAccount.project_id) {
    app = initializeApp({
      credential: cert(serviceAccount as { projectId: string; clientEmail: string; privateKey: string }),
    })
  } else if (existingApps.length > 0) {
    app = existingApps[0]
  }

  if (app) {
    auth = getFirebaseAdminAuth(app)
    firebaseAdminInitialized = true
  }
} catch (e) {
  console.error('[Firebase Admin] Initialization failed:', e instanceof Error ? e.message : String(e))
}

export { app, auth, firebaseAdminInitialized }