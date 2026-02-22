/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for MediaPipe WASM (SharedArrayBuffer needs cross-origin isolation)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          // Add CSP to allow YouTube embeds and scripts (fixes "refused to connect")
          {
            key: "Content-Security-Policy",
            value: "frame-src 'self' https://www.youtube.com https://*.youtube.com https://*.ytimg.com; script-src 'self' https://www.youtube.com https://*.youtube.com 'unsafe-inline'; connect-src 'self' https://www.youtube.com https://*.youtube.com;",
          },
          // Optional: Loosen referrer for cross-origin embeds if needed
          { key: "Referrer-Policy", value: "no-referrer-when-downgrade" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "yt3.ggpht.com" },
    ],
  },
  // Transpile mediapipe packages
  transpilePackages: ["@mediapipe/tasks-vision"],
};

export default nextConfig;