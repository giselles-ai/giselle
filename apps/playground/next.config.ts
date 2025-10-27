import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	serverExternalPackages: [
		"happy-dom",
		"@supabase/supabase-js",
		"@supabase/realtime-js",
	],
	experimental: {
		typedEnv: true,
	},
};

export default nextConfig;
