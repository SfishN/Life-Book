import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel's Next.js runtime expects the conventional output directory.
  // Keep the separate local directory so it does not collide with older builds.
  distDir: process.env.VERCEL ? ".next" : ".next-game",
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
