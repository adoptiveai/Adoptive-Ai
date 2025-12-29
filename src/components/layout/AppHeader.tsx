'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppBar,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import FeedbackIcon from '@mui/icons-material/Feedback';
import HomeIcon from '@mui/icons-material/Home';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuthStore } from '@/store/authStore';
import { dt } from '@/config/displayTexts';
import { ThemeToggle } from './ThemeToggle';

export function AppHeader() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [mobileAnchorEl, setMobileAnchorEl] = useState<null | HTMLElement>(null);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const handleOpenMobileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMobileAnchorEl(event.currentTarget);
  };

  const handleCloseMobileMenu = () => {
    setMobileAnchorEl(null);
  };

  const handleMobileNav = (path: string) => {
    router.push(path);
    handleCloseMobileMenu();
  };

  return (
    <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5" fontWeight={700} sx={{ color: 'primary.main', letterSpacing: '-0.5px' }}>
            AdoptiveAI
          </Typography>
        </Box>

        {/* Desktop Menu */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
          <Button startIcon={<HomeIcon />} onClick={() => router.push('/')}>Home</Button>
          <Button startIcon={<FeedbackIcon />} onClick={() => router.push('/feedback')}>
            {dt.FEEDBACK || 'Feedback'}
          </Button>
          <Button onClick={() => router.push('/profile')}>
            {user?.email}
          </Button>
          <ThemeToggle />
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Box>

        {/* Mobile Menu */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1 }}>
          <ThemeToggle />
          <IconButton
            size="large"
            onClick={handleOpenMobileMenu}
            color="inherit"
          >
            <MenuIcon />
          </IconButton>
          <Menu
            anchorEl={mobileAnchorEl}
            open={Boolean(mobileAnchorEl)}
            onClose={handleCloseMobileMenu}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={() => handleMobileNav('/')}>
              <HomeIcon sx={{ mr: 1 }} /> Home
            </MenuItem>
            <MenuItem onClick={() => handleMobileNav('/feedback')}>
              <FeedbackIcon sx={{ mr: 1 }} /> {dt.FEEDBACK || 'Feedback'}
            </MenuItem>
            <MenuItem onClick={() => handleMobileNav('/profile')}>
              Profile ({user?.email})
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} /> Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
