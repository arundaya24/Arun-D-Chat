/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverMinification: false,
    serverComponentsExternalPackages: [],
  },
};

export default nextConfig;
