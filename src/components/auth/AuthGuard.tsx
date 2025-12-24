'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { useAuthStore } from '@/store/authStore';
import { agentClient } from '@/services/agentClient';
import { isNoAuthEnabled } from '@/lib/env';

interface Props {
  children: ReactNode;
}

const noAuth = false; // Forced auth to ensure login redirect
const fallbackUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'admin@admin',
};

export function AuthGuard({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, setUser, accessToken, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (user && accessToken) {
      agentClient.setAuthToken(accessToken);
    }
  }, [user, accessToken]);

  useEffect(() => {
    if (noAuth && !user) {
      setUser(fallbackUser);
    }
  }, [user, setUser]);

  useEffect(() => {
    if (_hasHydrated && !noAuth && !isAuthenticated) {
      router.replace('/login?next=' + encodeURIComponent(pathname ?? '/'));
    }
  }, [isAuthenticated, router, pathname, _hasHydrated]);

  if (!_hasHydrated || (!noAuth && !isAuthenticated)) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return <>{children}</>;
}
