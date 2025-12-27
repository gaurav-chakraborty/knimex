import type { NextConfig } from "next";
import path from "node:path";

const LOADER = path.resolve(__dirname, 'src/visual-edits/component-tagger-loader.js');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  typescript: {
    // ignoreBuildErrors: true,
  },
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },
  webpack: (config, { isServer, webpack }) => {
    // Replace React Native file readers with empty modules
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /ReactNativeFileReader\.js$/,
        require.resolve('./src/lib/empty-module.js')
      ),
      new webpack.NormalModuleReplacementPlugin(
        /react-native-fs/,
        require.resolve('./src/lib/empty-module.js')
      )
    );
    
    // Ignore React Native dependencies
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^react-native$/,
      })
    );
    
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-native-fs': path.resolve(__dirname, 'src/lib/empty-module.js'),
      'react-native': path.resolve(__dirname, 'src/lib/empty-module.js'),
    };
    
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    
    return config;
  },
  turbopack: {
    rules: {
      "*.{jsx,tsx}": {
        loaders: [LOADER]
      }
    }
  }
};

export default nextConfig;
// Orchids restart: 1766795810221
