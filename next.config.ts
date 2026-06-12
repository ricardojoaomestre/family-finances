import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // The unified `radix-ui` package is a large barrel that re-exports every
    // primitive. Without this, the compiler resolves the whole surface on each
    // (re)compile, which is the export-map enumeration that drives dev-server
    // memory up over long sessions. `lucide-react` is already optimized by
    // Next's defaults.
    optimizePackageImports: ["radix-ui"],
  },
};

export default nextConfig;
