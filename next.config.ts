import type { NextConfig } from 'next';
const config: NextConfig = {
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
};
export default config;
