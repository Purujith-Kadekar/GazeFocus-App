import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // 'unsafe-inline' is required by Next.js App Router for its inline style/script
      // hydration chunks. Nonce-based CSP would need custom server infrastructure.
      // 'wasm-unsafe-eval' is required by MediaPipe for WebAssembly compilation.
      "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://www.youtube.com https://s.ytimg.com https://cdn.jsdelivr.net https://storage.googleapis.com https://www.gstatic.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://i.ytimg.com https://lh3.googleusercontent.com https://yt3.ggpht.com",
      "font-src 'self'",
      "connect-src 'self' https://www.googleapis.com https://www.youtube.com https://s.ytimg.com https://cdn.jsdelivr.net https://storage.googleapis.com https://www.gstatic.com https://*.supabase.co",
      "frame-src https://www.youtube.com https://youtube.com",
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
