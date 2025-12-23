import { Box, keyframes, useTheme } from '@mui/material';

const bounce = keyframes`
  0%, 80%, 100% { 
    transform: scale(0);
    opacity: 0.5;
  }
  40% { 
    transform: scale(1);
    opacity: 1;
  }
`;

export function ThinkingIndicator() {
    const theme = useTheme();

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, p: 1, height: 24 }}>
            {[0, 1, 2].map((i) => (
                <Box
                    key={i}
                    sx={{
                        width: 8,
                        height: 8,
                        bgcolor: theme.palette.text.secondary,
                        borderRadius: '50%',
                        animation: `${bounce} 1.4s infinite ease-in-out both`,
                        animationDelay: `${i * 0.16}s`,
                    }}
                />
            ))}
        </Box>
    );
}
