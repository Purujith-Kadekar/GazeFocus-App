import { cert, initializeApp, getApps } from 'firebase-admin/app'
import { getAuth as getFirebaseAdminAuth } from 'firebase-admin/auth'

let serviceAccount: any = {}
try {
  const jsonStr = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (jsonStr) {
    serviceAccount = JSON.parse(jsonStr)
  }
} catch (e) {
  // Silent fail
}

let app: ReturnType<typeof initializeApp> | undefined
let auth: ReturnType<typeof getFirebaseAdminAuth> | undefined

try {
  const existingApps = getApps()
  
  if (!existingApps.length && serviceAccount.project_id) {
    app = initializeApp({
      credential: cert(serviceAccount),
    })
  } else if (existingApps.length > 0) {
    app = existingApps[0]
  }

  if (app) {
    auth = getFirebaseAdminAuth(app)
  }
} catch (e) {
  // Silent fail
}

export { app, auth }