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
                mb: { xs: -4, md: -6 },
              }}
            >
              <Avatar
                sx={{
                  width: 128,
                  height: 128,
                  fontSize: '3rem',
                  bgcolor: 'background.paper',
                  color: 'primary.main',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  border: '4px solid',
                  borderColor: 'background.paper',
                }}
              >
                {user?.email ? getInitials(user.email) : <PersonIcon sx={{ fontSize: 64 }} />}
              </Avatar>
            </Box>

            {/* User Intro */}
            <Box sx={{ textAlign: 'center', mt: 8, mb: 6 }}>
              <Typography variant="h4" fontWeight={800} color="text.primary" gutterBottom>
                {user?.username || 'User Profile'}
              </Typography>
              <Chip
                label={user?.email || 'No Email'}
                variant="outlined"
                size="small"
                sx={{
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  borderColor: alpha(theme.palette.primary.main, 0.2),
                  color: 'primary.main',
                  fontWeight: 500
                }}
              />
            </Box>

            <Divider sx={{ mb: 6 }} />

            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 1.5, mb: 2, display: 'block' }}>
                  ACCOUNT DETAILS
                </Typography>

                <Stack spacing={2}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                      <PersonIcon />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">Username</Typography>
                      <Typography variant="body1" fontWeight={600}>{user?.username || 'Not set'}</Typography>
                    </Box>
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                      <EmailIcon />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">Email</Typography>
                      <Typography variant="body1" fontWeight={600}>{user?.email || 'Not available'}</Typography>
                    </Box>
                  </Paper>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 1.5, mb: 2, display: 'block' }}>
                  SECURITY
                </Typography>

                <Stack spacing={2}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 3,
                      bgcolor: 'background.paper',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Avatar sx={{ bgcolor: 'grey.200', color: 'text.secondary' }}>
                        <BadgeIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="text.secondary">User ID</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontFamily="monospace" fontWeight={500}>
                            {user?.id?.slice(0, 18)}...
                          </Typography>
                          <Tooltip title="Copy ID">
                            <IconButton size="small" onClick={() => copyToClipboard(user?.id || '', 'User ID')}>
                              <ContentCopyIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Box>
                  </Paper>

                  <Box sx={{ pt: 2 }}>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<LogoutIcon />}
                      onClick={handleLogout}
                      fullWidth
                      size="large"
                      sx={{
                        borderRadius: 3,
                        py: 1.5,
                        textTransform: 'none',
                        fontWeight: 600,
                        borderWidth: 2,
                        '&:hover': { borderWidth: 2, bgcolor: 'error.main', color: 'white' }
                      }}
                    >
                      {dt.LOGOUT || 'Sign Out'}
                    </Button>
                  </Box>
                </Stack>
              </Grid>
            </Grid>

          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
