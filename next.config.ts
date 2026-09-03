import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Cast headshot uploads (jpeg files) go through Server Actions as multipart
      // form data; the framework default (1mb) is too small for a photo.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
