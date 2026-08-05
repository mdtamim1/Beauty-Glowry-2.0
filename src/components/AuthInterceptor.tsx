'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export default function AuthInterceptor() {
  const isRefreshing = useRef(false);
  const refreshSubscribers = useRef<((token: string) => void)[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);

  const addRefreshSubscriber = (callback: (token: string) => void) => {
    refreshSubscribers.current.push(callback);
  };

  const onRefreshed = (token: string) => {
    refreshSubscribers.current.forEach((cb) => cb(token));
    refreshSubscribers.current = [];
  };

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalFetch = window.fetch;

    window.fetch = async function (input, init) {
      let response = await originalFetch(input, init);

      // Intercept 401 Unauthorized errors
      if (response.status === 401) {
        const headers = new Headers(init?.headers);
        const authHeader = headers.get('Authorization');
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
          if (!isRefreshing.current) {
            isRefreshing.current = true;

            try {
              const refreshResponse = await originalFetch('/api/auth/token/refresh', {
                method: 'POST',
              });

              if (refreshResponse.ok) {
                const data = await refreshResponse.json();
                const newAccessToken = data.accessToken;

                // Update Zustand store
                const currentUser = useAuthStore.getState().user;
                if (currentUser) {
                  useAuthStore.getState().login(currentUser, newAccessToken);
                }

                onRefreshed(newAccessToken);
                isRefreshing.current = false;
              } else {
                isRefreshing.current = false;
                useAuthStore.getState().logout();
                return response;
              }
            } catch (err: any) {
              isRefreshing.current = false;
              // Do NOT logout on network failures or aborts (e.g. during page transition)
              if (err && err.name !== 'AbortError' && err.message !== 'Failed to fetch') {
                useAuthStore.getState().logout();
              }
              return response;
            }
          }

          // Queue the request until token is refreshed
          return new Promise((resolve) => {
            addRefreshSubscriber((newToken) => {
              const updatedHeaders = new Headers(init?.headers);
              updatedHeaders.set('Authorization', `Bearer ${newToken}`);
              resolve(originalFetch(input, { ...init, headers: updatedHeaders }));
            });
          });
        }
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Synchronize social login session if available
  useEffect(() => {
    if (typeof window === 'undefined' || !hasHydrated) return;

    const syncSocialSession = async () => {
      // Only sync if there is no user in the Zustand store
      const currentUser = useAuthStore.getState().user;
      if (currentUser) return;

      try {
        const sessionRes = await fetch('/api/auth/session');
        if (!sessionRes.ok) return;

        const session = await sessionRes.json();
        if (session && session.user) {
          // Trigger sync endpoint to get custom JWT and register/login in local DB
          const syncRes = await fetch('/api/auth/social-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });

          if (syncRes.ok) {
            const data = await syncRes.json();
            if (data.success && data.user && data.token) {
              useAuthStore.getState().login(data.user, data.token);
              // Force page reload to refresh cart/wishlist sync and clean login state globally
              window.location.reload();
            }
          }
        }
      } catch (err) {
        console.error('Error synchronizing social login session:', err);
      }
    };

    syncSocialSession();
  }, [hasHydrated]);

  return null;
}
