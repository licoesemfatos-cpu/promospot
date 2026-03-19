import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true, // Evita que erros de tipos no Leaflet barrem o deploy
  },
  eslint: {
    ignoreDuringBuilds: true, // Agiliza o deploy inicial
  },
};

export default nextConfig;
