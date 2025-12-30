'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { dt } from '@/config/displayTexts';

export function LoginForm() {
  const router = useRouter();
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/chat');
    }
  }, [isAuthenticated, router]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    clearError();
    try {
      await login(email, password);
      // toast.success(dt.SUCCESS_MESSAGE || 'Welcome back!'); // Store might handle redirects or let the page do it
      // For now, let's assume we want to redirect to home
      router.push('/chat');
      toast.success('Welcome back!');
    } catch (err) {
      const message = err instanceof Error ? err.message : (dt.LOGIN_FAILED || 'Login failed');
      toast.error(message);
    }
  };

  const canSubmit = !!email && !!password;

  if (isAuthenticated) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%)',
        padding: 2,
      }}
    >
      <Card sx={{ maxWidth: 420, width: '100%', boxShadow: 8 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack spacing={3}>
            <Stack spacing={1.5} alignItems="center">
              <Typography variant="h4" fontWeight={800} sx={{ color: 'primary.main', mb: 1 }}>
                AdoptiveAI
              </Typography>
              <Typography variant="h5" fontWeight={600} textAlign="center">
                {dt.LOGIN_WELCOME || 'Welcome Back'}
              </Typography>
            </Stack>

            <Stack spacing={2}>
              <TextField
                label={dt.LOGIN_EMAIL_PROMPT || 'Email'}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                fullWidth
              />

              <TextField
                label={dt.LOGIN_PASSWORD_PROMPT || 'Password'}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                fullWidth
              />
            </Stack>

            {error && <Alert severity="error">{error}</Alert>}

            <Button
              variant="contained"
              size="large"
              onClick={handleLogin}
              disabled={!canSubmit || isLoading}
            >
              {isLoading ? <CircularProgress size={20} color="inherit" /> : (dt.LOGIN_BUTTON || 'Login')}
            </Button>

            <Typography variant="body2" textAlign="center">
              Don&apos;t have an account?{' '}
              <Link component="button" onClick={() => router.push('/register')} underline="hover">
                Register here
              </Link>
            </Typography>

          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
