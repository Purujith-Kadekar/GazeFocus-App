import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for MediaPipe WASM (SharedArrayBuffer needs cross-origin isolation)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
  // Allow YouTube iframe embedding
  async rewrites() {
    return [];
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
