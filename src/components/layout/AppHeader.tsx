'use client';

import { useRouter } from 'next/navigation';
import {
  AppBar,
  Box,
  Button,
  IconButton,
  Toolbar,
  Typography,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import FeedbackIcon from '@mui/icons-material/Feedback';
import HomeIcon from '@mui/icons-material/Home';
import { useAuthStore } from '@/store/authStore';
import { dt } from '@/config/displayTexts';

export function AppHeader() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box component="img" src="/polyrag.svg" alt="PolyRAG" sx={{ height: 36 }} />
          <Typography variant="h6" fontWeight={600}>
            PolyRAG
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button startIcon={<HomeIcon />} onClick={() => router.push('/')}>Home</Button>
          <Button startIcon={<FeedbackIcon />} onClick={() => router.push('/feedback')}>
            {dt.FEEDBACK || 'Feedback'}
          </Button>
          <Button onClick={() => router.push('/profile')}>
            {user?.email}
          </Button>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
