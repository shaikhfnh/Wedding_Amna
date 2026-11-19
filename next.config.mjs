/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',          // static site -> ./out (what Netlify serves)
  images: { unoptimized: true },
  trailingSlash: false,
};
export default nextConfig;
