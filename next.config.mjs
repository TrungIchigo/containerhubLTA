// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'uelfhngfhiirnxinvtbg.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Move to top-level as recommended
  serverExternalPackages: ['@supabase/supabase-js', '@supabase/ssr', '@supabase/node-fetch', 'isows', 'ws', 'bufferutil', 'utf-8-validate'],
  
  // Performance optimizations
  experimental: {
    // Enable faster refresh
    optimizePackageImports: ['@radix-ui/react-dialog', '@radix-ui/react-popover', 'lucide-react'],
    // Reduce memory usage
    memoryBasedWorkersCount: true,
  },
  
  // Compiler optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Webpack configuration for better module resolution
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Fix global and self issues for Supabase in server-side rendering
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'fs': false,
        'net': false,
        'tls': false,
        'crypto': false,
      }
    }
    
    // Fix self is not defined error
    config.plugins.push(
      new webpack.DefinePlugin({
        'typeof self': '"undefined"',
      })
    )
    // Development optimizations
    if (dev) {
      // Faster file watching
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      }
      
      // Enable caching for faster rebuilds
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      }
      
      // Optimize module resolution
      config.resolve.symlinks = false
      config.resolve.cacheWithContext = false
    }
    
    // General optimizations
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    }
    
    return config
  },
}

export default nextConfig