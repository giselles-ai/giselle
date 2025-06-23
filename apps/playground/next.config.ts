import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	serverExternalPackages: ["unstorage", "happy-dom"],
	experimental: {
		typedEnv: true,
	},
};

export default nextConfig;
