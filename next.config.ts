import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: ["homeweb.draco.be", "localhost", "192.168.55.109", "vw-2025-dev-1"],
};

export default nextConfig;
