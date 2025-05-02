/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  output: 'export',
  distDir: '.next',
  assetPrefix: './',
  trailingSlash: true,
};

module.exports = nextConfig; 