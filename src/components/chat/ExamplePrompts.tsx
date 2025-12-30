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
    <Box sx={{ mb: 6, px: { xs: 1, sm: 2 }, maxWidth: 'lg', mx: 'auto' }}>
      <Typography
        variant="h5"
        gutterBottom
        textAlign="center"
        sx={{
          mb: { xs: 2, sm: 4 },
          fontWeight: 700,
          fontSize: { xs: '1.25rem', sm: '1.5rem' },
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
          gap: { xs: 1.5, sm: 3 },
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
              p: { xs: 1.5, sm: 3 },
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 1.5, sm: 2.5 },
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px -10px rgba(0,0,0,0.15)',
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
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
                fontSize: { xs: '1.25rem', sm: '1.75rem' },
                width: { xs: 40, sm: 56 },
                height: { xs: 40, sm: 56 },
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
              <Typography variant="body1" fontWeight={600} sx={{ mb: 0.5, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                {prompt.button_text}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                Click to try this prompt
              </Typography>
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
