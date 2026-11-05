import type { NextConfig } from "next";
const config: NextConfig = {
  // Assets are already compressed locally. Serve them directly from the CDN:
  // Vercel Services currently routes the image optimizer to a 404.
  images: { qualities: [75, 90], unoptimized: true },
  poweredByHeader: false,
};
export default config;
