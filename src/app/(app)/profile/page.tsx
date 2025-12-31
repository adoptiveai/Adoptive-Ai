'use client';

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  useTheme,
  alpha
} from '@mui/material';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LogoutIcon from '@mui/icons-material/LogoutOutlined';
import PersonIcon from '@mui/icons-material/PersonOutline';
import EmailIcon from '@mui/icons-material/EmailOutlined';
import BadgeIcon from '@mui/icons-material/BadgeOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBackRounded';
import ContentCopyIcon from '@mui/icons-material/ContentCopyRounded';
import { useAuthStore } from '@/store/authStore';
import { dt } from '@/config/displayTexts';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const theme = useTheme();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  // Get initials for avatar
  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <Box sx={{ minHeight: '100%', bgcolor: 'background.default', py: { xs: 3, md: 6 } }}>
      <Container maxWidth="md">
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
          <Button
            component={Link}
            href="/"
            startIcon={<ArrowBackIcon />}
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': { color: 'primary.main', bgcolor: 'transparent' }
            }}
          >
            Back to Chat
          </Button>
          <Box sx={{ ml: 'auto' }}>
            <ThemeToggle />
          </Box>
        </Box>

        <Card
          elevation={0}
          sx={{
            borderRadius: 6,
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {/* Decorative Header */}
          <Box
            sx={{
              height: 200,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              position: 'relative',
            }}
          >
            <Box textOverflow={'clip'}
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '40%',
                background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)'
              }}
            />
          </Box>

          <CardContent sx={{ position: 'relative', pt: 0, px: { xs: 3, md: 6 }, pb: 6 }}>
            {/* Floating Avatar */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                transform: 'translateY(-50%)',
                mb: { xs: -4, md: -5 },
              }}
            >
              <Avatar
                sx={{
                  width: 140,
                  height: 140,
                  fontSize: '3.5rem',
                  bgcolor: 'background.paper',
                  color: 'primary.main',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                  border: '6px solid',
                  borderColor: 'background.paper',
                }}
              >
                {user?.email ? getInitials(user.email) : <PersonIcon sx={{ fontSize: 72 }} />}
              </Avatar>
            </Box>

            {/* User Intro & Details */}
            <Box sx={{ textAlign: 'center', mt: 8, maxWidth: 480, mx: 'auto' }}>
              <Typography variant="h4" fontWeight={800} color="text.primary" gutterBottom sx={{ mb: 1 }}>
                {user?.username || 'User Profile'}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Manage your account settings and preferences
              </Typography>

              <Stack spacing={3} sx={{ mb: 6 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2.5,
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 48, height: 48 }}>
                    <PersonIcon />
                  </Avatar>
                  <Box sx={{ flex: 1, textAlign: 'left' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={500} textTransform="uppercase" letterSpacing={1}>
                      Username
                    </Typography>
                    <Typography variant="h6" fontWeight={600} sx={{ fontSize: '1.1rem' }}>
                      {user?.username || 'Not set'}
                    </Typography>
                  </Box>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2.5,
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 48, height: 48 }}>
                    <EmailIcon />
                  </Avatar>
                  <Box sx={{ flex: 1, textAlign: 'left' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={500} textTransform="uppercase" letterSpacing={1}>
                      Email Address
                    </Typography>
                    <Typography variant="h6" fontWeight={600} sx={{ fontSize: '1.1rem' }}>
                      {user?.email || 'Not available'}
                    </Typography>
                  </Box>
                </Paper>
              </Stack>

              <Button
                variant="outlined"
                color="error"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                size="large"
                sx={{
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderWidth: 1.5,
                  '&:hover': { borderWidth: 1.5, bgcolor: 'error.main', color: 'white' }
                }}
              >
                {dt.LOGOUT || 'Sign Out'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
