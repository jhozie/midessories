/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'i.ibb.co', // Allow images from imgBB
    ],
  },
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = nextConfig 