import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "@libsql/client", "@prisma/adapter-libsql"],
  devIndicators: {
    appIsrStatus: false,
  },
};

export default nextConfig;
