'use client';

import * as React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import NextAppDirEmotionCacheProvider from './EmotionCache';
import theme from './theme';
import { ToastProvider } from '../providers/ToastProvider';
import { ThemeContextProvider, useThemeMode } from '@shared/theme/ThemeContext';
import WaterBackground from '@shared/ui/water-theme/WaterBackground';
import SaudiBackground from '@shared/ui/saudi-theme/SaudiBackground';

function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
    const { mode } = useThemeMode();
    const currentTheme = React.useMemo(() => theme(mode), [mode]);

    return (
        <ThemeProvider theme={currentTheme}>
            {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
            <CssBaseline />
            <WaterBackground />
            <SaudiBackground />
            <ToastProvider>
                {children}
            </ToastProvider>
        </ThemeProvider>
    );
}

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
    React.useEffect(() => {
        // Suppress browser console noise from aborted Next.js prefetches
        const originalConsoleError = console.error;
        console.error = (...args: any[]) => {
            const msg = args.map(arg => {
                if (arg instanceof Error) return arg.message + (arg.stack || '');
                if (typeof arg === 'object') return JSON.stringify(arg);
                return String(arg);
            }).join(' ');

            const isNoise = 
                msg.includes('net::ERR_ABORTED') ||
                msg.includes('_rsc=') ||
                msg.includes('Failed to fetch RSC payload') ||
                msg.includes('fetch-server-response') ||
                (msg.includes('Failed to fetch user') && msg.includes('<!DOCTYPE html>'));

            if (isNoise) return;
            
            originalConsoleError.apply(console, args);
        };

        // Event listeners for unhandled rejections/errors
        const isAbortedError = (arg: any) => {
            if (!arg) return false;

            // Convert arg to string to catch any hidden message properties
            const str = typeof arg === 'string' ? arg :
                (arg.message || (typeof arg.toString === 'function' ? arg.toString() : '') || '');

            if (str.includes('net::ERR_ABORTED') ||
                str.includes('ERR_ABORTED') ||
                str.includes('AbortError') ||
                str.includes('Failed to fetch') ||
                str.includes('fetchServerResponse') ||
                str.includes('fetch-server-response') ||
                str.includes('Failed to fetch RSC payload') ||
                str.includes('The user aborted a request') ||
                str.includes('Connection closed') ||
                str.includes('network error') ||
                str.includes('_rsc=')) {
                return true;
            }

            if (typeof arg === 'object') {
                const stack = arg.stack || '';
                const name = arg.name || '';
                const digest = arg.digest || '';
                return name.includes('AbortError') ||
                    stack.includes('fetch-server-response') ||
                    stack.includes('layout-router') ||
                    stack.includes('prefetch-cache-utils') ||
                    digest.includes('ERR_ABORTED');
            }
            return false;
        };

        const onUnhandledRejection = (event: PromiseRejectionEvent) => {
            const reason: any = event.reason;
            if (isAbortedError(reason)) {
                event.preventDefault();
            }
        };

        const onError = (event: ErrorEvent) => {
            if (isAbortedError(event.message) || isAbortedError(event.error)) {
                event.preventDefault();
                event.stopPropagation();
            }
        };

        const onResourceError = (event: Event) => {
            const target = event.target as HTMLElement;
            if (target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
                event.preventDefault();
                event.stopPropagation();
            }
        };

        window.addEventListener('unhandledrejection', onUnhandledRejection);
        window.addEventListener('error', onError);
        window.addEventListener('error', onResourceError, true); // Capture phase for resource errors

        return () => {
            console.error = originalConsoleError;
            window.removeEventListener('unhandledrejection', onUnhandledRejection);
            window.removeEventListener('error', onError);
            window.removeEventListener('error', onResourceError, true);
        };
    }, []);

    return (
        <NextAppDirEmotionCacheProvider options={{ key: 'mui' }}>
            <ThemeContextProvider>
                <ThemeProviderWrapper>
                    {children}
                </ThemeProviderWrapper>
            </ThemeContextProvider>
        </NextAppDirEmotionCacheProvider>
    );
}
