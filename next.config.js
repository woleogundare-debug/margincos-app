/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['xdlcglpqyrbknirdjgbg.supabase.co'],
  },
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/landing.html',
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // @react-pdf/renderer uses Node APIs that must not be bundled server-side
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('@react-pdf/renderer');
    }
    return config;
  },
};
module.exports = nextConfig;
