import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV !== "production";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), gyroscope=(), accelerometer=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin-allow-popups",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // 'unsafe-inline' is required by Next.js App Router for its inline style/script
      // hydration chunks. Nonce-based CSP would need custom server infrastructure.
      // 'wasm-unsafe-eval' is required by MediaPipe for WebAssembly compilation.
      `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""} 'wasm-unsafe-eval' https://www.youtube.com https://s.ytimg.com https://cdn.jsdelivr.net https://unpkg.com https://storage.googleapis.com https://www.gstatic.com https://apis.google.com https://accounts.google.com`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://i.ytimg.com https://img.youtube.com https://*.googleusercontent.com https://*.ggpht.com",
      "font-src 'self'",
      // Firebase Auth client SDK endpoints. The extension OAuth bridge
      // (/auth/extension-oauth) is the only page running Firebase auth in the
      // browser — if any of these are missing, fetches fail and the SDK
      // surfaces it as auth/network-request-failed.
      "connect-src 'self' https://www.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebase.googleapis.com https://firebaseinstallations.googleapis.com https://apis.google.com https://accounts.google.com https://www.youtube.com https://s.ytimg.com https://cdn.jsdelivr.net https://unpkg.com https://storage.googleapis.com https://www.gstatic.com https://*.supabase.co https://vid.puffyan.us https://inv.nadeko.net https://invidious.nerdvpn.de https://yewtu.be https://inv.tux.pizza https://invidious.privacyredirect.com https://iv.ggtyler.dev https://yt.cdaut.de https://pipedapi.kavin.rocks https://pipedapi.adminforge.de https://pipedapi.in.projectsegfau.lt https://watchapi.whatever.social https://pipedapi.r4fo.com https://pipedapi-libre.kavin.rocks",
      "frame-src https://www.youtube.com https://youtube.com https://gazefocus-38363.firebaseapp.com https://*.firebaseapp.com",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
]

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "yt3.ggpht.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "**.ggpht.com" },
    ],
  },
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ]
  },
};

export default nextConfig;
