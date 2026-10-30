/** @type {import("next").NextConfig} */
const nextConfig = {
  images: {
    qualities: [75, 85, 90],
    deviceSizes: [640, 828, 1200, 2048],
    imageSizes: [384]
  }
};

export default nextConfig;
