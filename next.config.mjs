/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["wagmi", "@wagmi/core", "@wagmi/connectors", "viem", "mipd"],
};

export default nextConfig;
