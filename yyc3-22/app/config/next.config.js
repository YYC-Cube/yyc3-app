/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // 构建健康监控
  webpack: (config, { buildId, dev, isServer, webpack }) => {
    // 构建资源监控
    config.plugins.push(new webpack.ProgressPlugin());

    // 包大小健康检查
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              enforce: true,
            },
          },
        },
      };
    }

    return config;
  },
  // 运行时健康配置
  compiler: {
    removeConsole: !process.env.DEV,
  },
  // 性能健康配置
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
};

module.exports = nextConfig;
