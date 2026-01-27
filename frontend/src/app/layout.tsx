import type { Metadata } from 'next'
import './globals.css'

// Force all pages to be dynamically rendered (no static generation)
// This is required because the app uses authentication and dynamic features
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export const metadata: Metadata = {
    title: {
        default: 'Zedny LMS',
        template: '%s | Zedny LMS',
    },
    description: 'Learning Management System - Complete TalentLMS Clone',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </head>
            <body>
                {children}
            </body>
        </html>
    )
}