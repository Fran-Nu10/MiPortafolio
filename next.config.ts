import type { NextConfig } from "next";
import { liveOrigins } from "./src/data/live";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // frame-src: nothing but the live builds can be embedded here
          // frame-ancestors: this site itself is not embeddable elsewhere
          { key: "Content-Security-Policy", value: `frame-src 'self' ${liveOrigins.join(" ")}; frame-ancestors 'self'` },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
