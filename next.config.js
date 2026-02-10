/**
 * MVP Next.js Configuration
 *
 * Keep this minimal so `next dev` runs without optional Neo4j/Neode setup.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  compress: true,
  async rewrites() {
    const enginePort = process.env.ENGINE_PORT || '3001'
    return [
      {
        source: '/engine/:path*',
        destination: `http://localhost:${enginePort}/engine/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
