/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Enable server-side functionality
  // output: 'export', // DISABLED - This breaks all API routes and server features
  trailingSlash: false,
  images: {
    unoptimized: true
  },
  
  // Environment variables for production
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.ebookai.com',
    NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV || 'production'
  },
  
  // Disable server-side features for static export
  experimental: {
    // Remove deprecated appDir option
  },
  
  // Webpack configuration for optimal bundling
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  
  // Headers removed for static export compatibility
  // Will be handled by Netlify _headers file
};

module.exports = nextConfig;