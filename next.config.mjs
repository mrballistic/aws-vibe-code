/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudscape recommends transpiling these packages under Next.js.
  transpilePackages: [
    '@cloudscape-design/components',
    '@cloudscape-design/component-toolkit'
  ]
};

export default nextConfig;
