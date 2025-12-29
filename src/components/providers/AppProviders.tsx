'use client';

import { ReactNode, useState, useMemo, useEffect } from 'react';
import { ThemeProvider as MUIThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider as NextThemeProvider, useTheme } from 'next-themes';

interface Props {
  children: ReactNode;
}

function MUIThemeWrapper({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const theme = useMemo(() => {
    const mode = mounted && resolvedTheme === 'dark' ? 'dark' : 'light';
    return createTheme({
      palette: {
        mode,
        primary: {
          main: mode === 'dark' ? '#3b82f6' : '#1a5ed5',
        },
        secondary: {
          main: '#006d77',
        },
        background: {
          default: mode === 'dark' ? '#0a0a0a' : '#f9fafb',
          paper: mode === 'dark' ? '#121212' : '#ffffff',
        },
      },
      typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", sans-serif',
      },
      components: {
        MuiButton: {
          defaultProps: {
            disableElevation: true,
          },
          styleOverrides: {
            root: {
              textTransform: 'none',
              borderRadius: 8,
            },
          },
        },
      },
    });
  }, [resolvedTheme, mounted]);

  return (
    <MUIThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  );
}

export function AppProviders({ children }: Props) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <NextThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <MUIThemeWrapper>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster position="top-right" />
        </QueryClientProvider>
      </MUIThemeWrapper>
    </NextThemeProvider>
  );
}
