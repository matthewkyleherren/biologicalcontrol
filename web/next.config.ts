import type {NextConfig} from 'next'

const nextConfig: NextConfig = {
  transpilePackages: [
    '@biologicalcontrol/api',
    '@biologicalcontrol/db',
    '@biologicalcontrol/shared',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
}

export default nextConfig
