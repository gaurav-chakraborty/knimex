import path from "node:path";
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const nextConfig = {
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
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer, webpack }) => {
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
};

export default nextConfig;
// Orchids restart: 1766813277004
