import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	serverExternalPackages: ["unstorage"],
	experimental: {
		typedEnv: true,
	},
};

export default nextConfig;
