/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    reactStrictMode: true,
    skipTrailingSlashRedirect: false,
    trailingSlash: false,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb',
        },
    },
    // Proxy API routes to Python/FastAPI backend
    async rewrites() {
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
        
        console.log(`[next.config.js] Proxying API routes to FastAPI: ${backendUrl}`);

        return [
            // Proxy all /api/* routes to FastAPI backend
            {
                source: '/api/:path*',
                destination: `${backendUrl}/api/:path*`,
            },
        ];
    },
    // Environment variables to expose to the client
    env: {
        BACKEND_URL: process.env.BACKEND_URL,
    },
};

module.exports = nextConfig;