/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for MediaPipe WASM (SharedArrayBuffer needs cross-origin isolation)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          // Use credentialless instead of require-corp to allow YouTube iframes to load
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
          {
            key: "Content-Security-Policy",
            // Allow MediaPipe CDN and Model Storage, plus allow worker/blob for WASM
            value: "frame-src 'self' https://www.youtube.com https://*.youtube.com https://*.ytimg.com; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.youtube.com https://*.youtube.com https://cdn.jsdelivr.net; connect-src 'self' https://www.youtube.com https://*.youtube.com https://cdn.jsdelivr.net https://storage.googleapis.com; worker-src 'self' blob:; child-src 'self' blob:;",
          },
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