/** @type {import('next').NextConfig} */
const isRailway = Boolean(
  process.env.RAILWAY_ENVIRONMENT_ID ||
  process.env.RAILWAY_PROJECT_ID ||
  process.env.RAILWAY_SERVICE_ID
);

const nextConfig = isRailway ? { output: 'standalone' } : {};

export default nextConfig;
