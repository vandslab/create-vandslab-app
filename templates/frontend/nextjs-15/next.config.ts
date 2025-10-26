import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "standalone",
	eslint: {
		// Warning: This allows production builds to successfully complete even if
		// your project has ESLint errors.
		//ignoreDuringBuilds: true,
	},
	// Next.js 15+ handles CORS differently - no need for allowedDevOrigins
	// For local network testing, use: next dev -H 0.0.0.0
};

export default nextConfig;
