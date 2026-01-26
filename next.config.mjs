/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/aws-vibe-code',
  images: {
    unoptimized: true,
  },
  // Cloudscape recommends transpiling these packages under Next.js.
  transpilePackages: [
    '@cloudscape-design/components',
    '@cloudscape-design/component-toolkit'
  ]
};

export default nextConfig;
