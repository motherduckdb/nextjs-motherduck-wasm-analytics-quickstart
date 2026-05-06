/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@motherduck/wasm-client', 'apache-arrow'],
}

export default nextConfig;
