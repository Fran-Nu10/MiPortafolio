import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Stills (posters, captures): AVIF first, WebP fallback (Spec §17)
    formats: ["image/avif", "image/webp"],
    // the optimizer serves only approved sources (Phase 12): the three public client captures and
    // the generated media — never public/projects/travelsuite360 (unapproved, Spec §23)
    localPatterns: [
      { pathname: "/projects/prospector/**", search: "" },
      { pathname: "/projects/santi-nuca/**", search: "" },
      { pathname: "/projects/chef-arturo/**", search: "" },
      { pathname: "/media/**", search: "" },
    ],
  },
  async rewrites() {
    return {
      // TravelSuite360's ENSAMBLE captures show blurred production data and are not approved (Spec §23):
      // they stay in the repository as candidates but are never served (404), whatever the URL
      beforeFiles: [{ source: "/projects/travelsuite360/:path*", destination: "/_not-published" }],
      afterFiles: [],
      fallback: [],
    };
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
