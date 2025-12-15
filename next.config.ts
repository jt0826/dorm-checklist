/** @type {import('next').NextConfig} */
const nextConfig = {
  //output: 'export', // Static export
  images: {
    unoptimized: true,
  },
  // Remove API routes from build
  trailingSlash: true,
};

module.exports = nextConfig;