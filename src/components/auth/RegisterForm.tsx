'use client';

import { useState } from 'react';
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

export function RegisterForm() {
    const router = useRouter();
    const { register, isLoading, error, clearError } = useAuthStore();

    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleRegister = async () => {
        clearError();
        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        try {
            await register(email, username, password);
            toast.success('Account created successfully! Please login.');
            router.push('/login');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Registration failed';
            toast.error(message);
        }
    };

    const canSubmit = !!email && !!username && !!password && !!confirmPassword;

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
                <CardContent sx={{ p: 4 }}>
                    <Stack spacing={3}>
                        <Stack spacing={1.5} alignItems="center">
                            <Box component="img" src="/polyrag.svg" alt="PolyRAG" sx={{ height: 56 }} />
                            <Typography variant="h5" fontWeight={600} textAlign="center">
                                Create Account
                            </Typography>
                        </Stack>

                        <Stack spacing={2}>
                            <TextField
                                label="Email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                fullWidth
                                required
                            />
                            <TextField
                                label="Username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                fullWidth
                                required
                            />
                            <TextField
                                label="Password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                fullWidth
                                required
                            />
                            <TextField
                                label="Confirm Password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                fullWidth
                                required
                            />
                        </Stack>

                        {error && <Alert severity="error">{error}</Alert>}

                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleRegister}
                            disabled={!canSubmit || isLoading}
                        >
                            {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Register'}
                        </Button>

                        <Typography variant="body2" textAlign="center">
                            Already have an account?{' '}
                            <Link component="button" onClick={() => router.push('/login')} underline="hover">
                                Login here
                            </Link>
                        </Typography>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
}
