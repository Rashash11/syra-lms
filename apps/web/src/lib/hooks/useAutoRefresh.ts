'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Hook to automatically refresh authentication tokens before they expire.
 * 
 * This hook runs in the background and refreshes the access token
 * 5 minutes before it expires, ensuring the user stays logged in
 * as long as they have a valid refresh token.
 * 
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   useAutoRefresh();
 *   // ... rest of component
 * }
 * ```
 */
export function useAutoRefresh() {
  const router = useRouter();

  const refreshToken = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        // Refresh failed, redirect to login
        console.warn('[AutoRefresh] Token refresh failed, redirecting to login');
        router.push('/login');
        return false;
      }

      console.log('[AutoRefresh] Token refreshed successfully');
      return true;
    } catch (error) {
      console.error('[AutoRefresh] Error refreshing token:', error);
      router.push('/login');
      return false;
    }
  }, [router]);

  useEffect(() => {
    // Refresh token every 10 minutes (access token expires in 15 minutes)
    // This ensures we refresh before expiration
    const interval = setInterval(() => {
      refreshToken();
    }, 10 * 60 * 1000); // 10 minutes

    // Also refresh on mount if needed
    refreshToken();

    return () => clearInterval(interval);
  }, [refreshToken]);
}

/**
 * Hook to manually trigger a token refresh.
 * 
 * Returns a function that can be called to refresh the token.
 * Useful for refreshing after a failed API call.
 * 
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const refresh = useManualRefresh();
 *   
 *   const handleApiCall = async () => {
 *     const response = await fetch('/api/some-endpoint');
 *     if (response.status === 401) {
 *       const refreshed = await refresh();
 *       if (refreshed) {
 *         // Retry the API call
 *       }
 *     }
 *   };
 * }
 * ```
 */
export function useManualRefresh() {
  const router = useRouter();

  return useCallback(async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        console.warn('[ManualRefresh] Token refresh failed');
        router.push('/login');
        return false;
      }

      console.log('[ManualRefresh] Token refreshed successfully');
      return true;
    } catch (error) {
      console.error('[ManualRefresh] Error refreshing token:', error);
      router.push('/login');
      return false;
    }
  }, [router]);
}
