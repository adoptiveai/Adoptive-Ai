'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChatPage } from '@/components/chat/ChatPage';
import { useAuthStore } from '@/store/authStore';
import { Box, CircularProgress } from '@mui/material';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return <ChatPage />;
}
