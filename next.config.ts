import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'media.giphy.com',
      'res.cloudinary.com',
      'cloudinary.com'
    ],
  },
};

export default nextConfig;
