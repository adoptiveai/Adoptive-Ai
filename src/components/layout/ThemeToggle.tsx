'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { IconButton, Tooltip } from '@mui/material';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme, resolvedTheme } = useTheme();

    // useEffect only runs on the client, so now we can safely show the UI
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <IconButton color="inherit" disabled>
                <Sun size={20} />
            </IconButton>
        );
    }

    const isDark = resolvedTheme === 'dark';

    return (
        <Tooltip title={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
            <IconButton
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                color="inherit"
                sx={{
                    transition: 'transform 0.2s',
                    '&:hover': {
                        transform: 'rotate(15deg) scale(1.1)',
                    },
                }}
            >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </IconButton>
        </Tooltip>
    );
}
