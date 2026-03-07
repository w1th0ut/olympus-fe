import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["wagmi", "@wagmi/core", "@wagmi/connectors", "viem", "mipd"],
};

export default withMDX(nextConfig);
