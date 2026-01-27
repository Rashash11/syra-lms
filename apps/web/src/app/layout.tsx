import type { Metadata } from 'next'
import './globals.css'

// Force all pages to be dynamically rendered (no static generation)
// This is required because the app uses authentication and dynamic features
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export const metadata: Metadata = {
    title: {
        default: 'SYRA LMS',
        template: '%s | SYRA LMS',
    },
    description: 'Cloud Learning Management System',
}


import ThemeRegistry from '@shared/theme/ThemeRegistry'
import { LiquidMeshBackground } from '@shared/ui/components/LiquidMeshBackground'
import { LiquidGlassAssets } from '@shared/ui/components/LiquidGlassAssets'

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className="dark" suppressHydrationWarning>
            <head>
            </head>
            <body style={{ position: 'relative', overflowX: 'hidden' }}>
                <ThemeRegistry>
                    <LiquidGlassAssets />
                    <LiquidMeshBackground />
                    {children}
                </ThemeRegistry>
            </body>
        </html>
    )
}
