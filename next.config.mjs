/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          // credentialless allows YouTube iframes while still enabling SharedArrayBuffer
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
          // CSP to allow YouTube embeds/scripts/connections (fixes "refused to connect")
          {
            key: "Content-Security-Policy",
            value: "frame-src 'self' https://www.youtube.com https://*.youtube.com https://*.ytimg.com; script-src 'self' https://www.youtube.com https://*.youtube.com 'unsafe-inline'; connect-src 'self' https://www.youtube.com https://*.youtube.com;",
          },
          // Loosen referrer for embeds
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