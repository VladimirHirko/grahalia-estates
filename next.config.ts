import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // ✅ чтобы не падало на фото/пдф
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
