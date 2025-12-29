'use client';

import { Box, Button, Paper, Typography } from '@mui/material';
import { dt } from '@/config/displayTexts';

interface ExamplePromptsProps {
  onSelect: (prompt: string) => void;
}

export function ExamplePrompts({ onSelect }: ExamplePromptsProps) {
  const prompts = Array.isArray(dt.EXAMPLE_PROMPTS) ? dt.EXAMPLE_PROMPTS : [];
  if (!prompts.length) return null;

  return (
    <Box sx={{ mb: 6, px: 2, maxWidth: 'lg', mx: 'auto' }}>
      <Typography
        variant="h5"
        gutterBottom
        textAlign="center"
        sx={{
          mb: 4,
          fontWeight: 700,
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {dt.WELCOME_MESSAGE || 'Welcome to AdoptiveAI - Your AI Research Assistant'}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
          },
        }}
      >
        {prompts.map((prompt, index) => (
          <Paper
            key={prompt.key}
            elevation={0}
            onClick={() => onSelect(prompt.suggested_command_text)}
            sx={{
              p: 3,
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              border: '1px solid',
              borderColor: 'divider',
              background: 'background.paper',
              display: 'flex',
              alignItems: 'center',
              gap: 2.5,
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px -10px rgba(0,0,0,0.15)',
                borderColor: 'transparent',
                '&::before': {
                  opacity: 1,
                },
                '& .icon-box': {
                  transform: 'scale(1.1) rotate(5deg)',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                }
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                borderRadius: 4,
                padding: '2px',
                background: `linear-gradient(135deg, ${['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][index % 4]}, ${['#FFE66D', '#FF8B94', '#FFEEAD', '#D4A5A5'][index % 4]})`,
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
                opacity: 0,
                transition: 'opacity 0.3s ease',
                pointerEvents: 'none',
              }
            }}
          >
            <Box
              className="icon-box"
              sx={{
                fontSize: '1.75rem',
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: 'action.hover',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                flexShrink: 0,
              }}
            >
              {prompt.icon ?? '💡'}
            </Box>
            <Box>
              <Typography variant="body1" fontWeight={600} sx={{ mb: 0.5 }}>
                {prompt.button_text}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Click to try this prompt
              </Typography>
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
