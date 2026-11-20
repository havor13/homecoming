import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Uploads go through server actions. Keep this just above the 4 MB attachment cap.
    serverActions: { bodySizeLimit: "5mb" },
  },
};

export default nextConfig;
