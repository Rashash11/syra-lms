/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    reactStrictMode: true,
    // Disable static optimization - all pages are dynamic due to auth
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
    // Strangler Pattern: Proxy migrated API routes to Python/FastAPI backend
    // Set PYTHON_BACKEND_URL=http://localhost:8000 in .env to enable
    async rewrites() {
        const localStubs = [
            {
                source: '/@vite/:path*',
                destination: '/api/vite/:path*',
            },
            {
                source: '/@react-refresh',
                destination: '/api/vite/react-refresh',
            },
        ];

        const backendUrl = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000';

        console.log(`[next.config.js] Proxying API routes to FastAPI: ${backendUrl}`);

        const useDirectAppRoutes = process.env.USE_DIRECT_APP_ROUTES === '1';
        return [
            ...localStubs,
            // ===== Routes fully migrated to FastAPI =====
            // These routes are served by the Python backend

            // Instructor
            {
                source: '/api/instructor/:path*',
                destination: `${backendUrl}/api/instructor/:path*`,
            },
            // Courses (includes nested routes)
            ...(!useDirectAppRoutes ? [{
                source: '/api/courses/:path*',
                destination: `${backendUrl}/api/courses/:path*`,
            }] : []),
            // Enrollments
            {
                source: '/api/enrollments/:path*',
                destination: `${backendUrl}/api/enrollments/:path*`,
            },
            {
                source: '/api/enrollments',
                destination: `${backendUrl}/api/enrollments`,
            },
            // Groups
            ...(!useDirectAppRoutes ? [{
                source: '/api/groups/:path*',
                destination: `${backendUrl}/api/groups/:path*`,
            }, {
                source: '/api/groups',
                destination: `${backendUrl}/api/groups`,
            }] : []),
            // Categories
            {
                source: '/api/categories/:path*',
                destination: `${backendUrl}/api/categories/:path*`,
            },
            {
                source: '/api/categories',
                destination: `${backendUrl}/api/categories`,
            },
            // Branches
            {
                source: '/api/branches/:path*',
                destination: `${backendUrl}/api/branches/:path*`,
            },
            {
                source: '/api/branches',
                destination: `${backendUrl}/api/branches`,
            },
            // Learning Paths
            ...(!useDirectAppRoutes ? [{
                source: '/api/learning-paths/:path*',
                destination: `${backendUrl}/api/learning-paths/:path*`,
            }, {
                source: '/api/learning-paths',
                destination: `${backendUrl}/api/learning-paths`,
            }] : []),
            // Assignments
            {
                source: '/api/assignments/:path*',
                destination: `${backendUrl}/api/assignments/:path*`,
            },
            {
                source: '/api/assignments',
                destination: `${backendUrl}/api/assignments`,
            },
            // Submissions
            {
                source: '/api/submissions/:path*',
                destination: `${backendUrl}/api/submissions/:path*`,
            },
            {
                source: '/api/submissions',
                destination: `${backendUrl}/api/submissions`,
            },
            // Notifications
            {
                source: '/api/notifications/:path*',
                destination: `${backendUrl}/api/notifications/:path*`,
            },
            {
                source: '/api/notifications',
                destination: `${backendUrl}/api/notifications`,
            },
            // Reports
            {
                source: '/api/reports/:path*',
                destination: `${backendUrl}/api/reports/:path*`,
            },
            {
                source: '/api/dashboard',
                destination: `${backendUrl}/api/dashboard`,
            },
            {
                source: '/api/reports',
                destination: `${backendUrl}/api/reports`,
            },
            // Users
            ...(!useDirectAppRoutes ? [{
                source: '/api/users',
                destination: `${backendUrl}/api/users`,
            }, {
                source: '/api/users/:path*',
                destination: `${backendUrl}/api/users/:path*`,
            }] : []),
            // Health check
            {
                source: '/api/health',
                destination: `${backendUrl}/api/health`,
            },

            // Auth (cookies forwarded)
            {
                source: '/api/auth/:path*',
                destination: `${backendUrl}/api/auth/:path*`,
            },
            // Me
            {
                source: '/api/me',
                destination: `${backendUrl}/api/me`,
            },
            {
                source: '/api/me/:path*',
                destination: `${backendUrl}/api/me/:path*`,
            },
            // Admin
            {
                source: '/api/admin/:path*',
                destination: `${backendUrl}/api/admin/:path*`,
            },
            // Catalog
            {
                source: '/api/catalog/:path*',
                destination: `${backendUrl}/api/catalog/:path*`,
            },
            {
                source: '/api/courses/:path*',
                destination: `${backendUrl}/api/courses/:path*`,
            },
            {
                source: '/api/upload',
                destination: `${backendUrl}/api/upload`,
            },
            {
                source: '/api/files/:path*',
                destination: `${backendUrl}/api/files/:path*`,
            },
            {
                source: '/api/instructor/:path*',
                destination: `${backendUrl}/api/instructor/:path*`,
            },
            {
                source: '/api/super-instructor/:path*',
                destination: `${backendUrl}/api/super-instructor/:path*`,
            },
            {
                source: '/api/automations/:path*',
                destination: `${backendUrl}/api/automations/:path*`,
            },
            {
                source: '/api/skills/:path*',
                destination: `${backendUrl}/api/skills/:path*`,
            },
            {
                source: '/api/conferences/:path*',
                destination: `${backendUrl}/api/conferences/:path*`,
            },
            {
                source: '/api/learning-paths/:path*',
                destination: `${backendUrl}/api/learning-paths/:path*`,
            },
            {
                source: '/api/learner/:path*',
                destination: `${backendUrl}/api/learner/:path*`,
            },
            // Catch-all to ensure JSON 404 via backend
            // {
            //     source: '/api/:path*',
            //     destination: `${backendUrl}/api/:path*`,
            // },
        ];
    },
}


module.exports = nextConfig
