/**
 * Next.js Configuration
 * Production-ready configuration for the AI Ebook Platform frontend
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // React configuration
  reactStrictMode: true,
  swcMinify: true,
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_GA_TRACKING_ID: process.env.NEXT_PUBLIC_GA_TRACKING_ID,
    NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV || 'development'
  },
  
  // Image optimization
  images: {
    domains: [
      'localhost',
      'ai-ebook-platform.com',
      'cdn.ai-ebook-platform.com',
      'images.unsplash.com',
      'via.placeholder.com'
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
  },
  
  // Internationalization
  i18n: {
    locales: ['en', 'es', 'fr', 'de'],
    defaultLocale: 'en',
    localeDetection: true
  },
  
  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
          }
        ]
      }
    ];
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/app/dashboard',
        permanent: true
      },
      {
        source: '/books',
        destination: '/app/books',
        permanent: true
      },
      {
        source: '/settings',
        destination: '/app/settings',
        permanent: true
      }
    ];
  },
  
  // Rewrites for API proxy
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/v1/:path*`
      }
    ];
  },
  
  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Bundle analyzer
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: isServer ? '../analyze/server.html' : './analyze/client.html'
        })
      );
    }
    
    // Optimize bundle splitting
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10
        },
        editor: {
          test: /[\\/]node_modules[\\/](@tiptap|prosemirror)/,
          name: 'editor',
          chunks: 'all',
          priority: 20
        },
        charts: {
          test: /[\\/]node_modules[\\/](recharts|d3)/,
          name: 'charts',
          chunks: 'all',
          priority: 20
        }
      }
    };
    
    // Add aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/hooks': path.resolve(__dirname, 'src/hooks'),
      '@/services': path.resolve(__dirname, 'src/services'),
      '@/store': path.resolve(__dirname, 'src/store'),
      '@/utils': path.resolve(__dirname, 'src/utils'),
      '@/styles': path.resolve(__dirname, 'src/styles')
    };
    
    return config;
  },
  
  // Experimental features
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['@tiptap/core', '@tiptap/starter-kit'],
    optimizeCss: true,
    scrollRestoration: true
  },
  
  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error']
    } : false
  },
  
  // Output configuration
  output: 'standalone',
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false
  },
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false
  },
  
  // Performance budgets
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2
  },
  
  // PWA configuration (if using next-pwa)
  ...(process.env.NODE_ENV === 'production' && {
    pwa: {
      dest: 'public',
      register: true,
      skipWaiting: true,
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts',
            expiration: {
              maxEntries: 4,
              maxAgeSeconds: 365 * 24 * 60 * 60 // 365 days
            }
          }
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-static',
            expiration: {
              maxEntries: 4,
              maxAgeSeconds: 365 * 24 * 60 * 60 // 365 days
            }
          }
        },
        {
          urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'static-font-assets',
            expiration: {
              maxEntries: 4,
              maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
            }
          }
        },
        {
          urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'static-image-assets',
            expiration: {
              maxEntries: 64,
              maxAgeSeconds: 24 * 60 * 60 // 24 hours
            }
          }
        },
        {
          urlPattern: /\/_next\/image\?url=.+$/i,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'next-image',
            expiration: {
              maxEntries: 64,
              maxAgeSeconds: 24 * 60 * 60 // 24 hours
            }
          }
        },
        {
          urlPattern: /\.(?:js)$/i,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'static-js-assets',
            expiration: {
              maxEntries: 32,
              maxAgeSeconds: 24 * 60 * 60 // 24 hours
            }
          }
        },
        {
          urlPattern: /\.(?:css|less)$/i,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'static-style-assets',
            expiration: {
              maxEntries: 32,
              maxAgeSeconds: 24 * 60 * 60 // 24 hours
            }
          }
        },
        {
          urlPattern: /^https:\/\/.*\.(?:json)$/i,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'json-cache'
          }
        },
        {
          urlPattern: /\/api\/.*$/i,
          handler: 'NetworkFirst',
          method: 'GET',
          options: {
            cacheName: 'apis',
            expiration: {
              maxEntries: 16,
              maxAgeSeconds: 24 * 60 * 60 // 24 hours
            },
            networkTimeoutSeconds: 10
          }
        },
        {
          urlPattern: /.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'others',
            expiration: {
              maxEntries: 32,
              maxAgeSeconds: 24 * 60 * 60 // 24 hours
            },
            networkTimeoutSeconds: 10
          }
        }
      ]
    }
  })
};

module.exports = nextConfig;