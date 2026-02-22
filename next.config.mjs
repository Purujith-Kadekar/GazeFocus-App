/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              // Allow YouTube embeds
              "frame-src 'self' https://www.youtube.com https://*.youtube.com https://*.ytimg.com",
              // Allow MediaPipe WASM + YouTube scripts
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.youtube.com https://*.youtube.com https://cdn.jsdelivr.net",
              // Allow MediaPipe model downloads + YouTube API calls
              "connect-src 'self' https://www.youtube.com https://*.youtube.com https://cdn.jsdelivr.net https://storage.googleapis.com",
              // Allow WASM workers
              "worker-src 'self' blob:",
              "child-src 'self' blob:",
            ].join("; "),
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
};

export default nextConfig;
