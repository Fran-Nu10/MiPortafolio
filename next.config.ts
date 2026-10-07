import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Stills (posters, captures): AVIF first, WebP fallback (Spec §17)
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // REVELADO embeds nothing; the site itself is not embeddable elsewhere
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
