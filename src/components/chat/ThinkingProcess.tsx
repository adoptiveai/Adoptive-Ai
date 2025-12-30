'use client';

import { useState } from 'react';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Stack,
    Typography,
    useTheme,
    alpha,
    keyframes,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { ChatMessage } from '@/types/api';
import { dt } from '@/config/displayTexts';

// Import tool rendering logic from ChatMessages or duplicate/refactor it.
// For now, I will accept a render function or children to keep it flexible,
// but given the plan, I should probably move the specific tool rendering logic here or keep it in ChatMessages and pass it down.
// To keep it clean, I'll accept the messages and a render callback for the details.

interface ThinkingProcessProps {
    messages: ChatMessage[];
    renderToolDetails: (message: ChatMessage) => React.ReactNode;
    isOpen?: boolean;
}

const pulse = keyframes`
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
`;

export function ThinkingProcess({ messages, renderToolDetails, isOpen = false }: ThinkingProcessProps) {
    const theme = useTheme();
    const [expanded, setExpanded] = useState(isOpen);

    return (
        <Box sx={{ width: '100%', mb: 1 }}>
            <Box
                onClick={() => setExpanded(!expanded)}
                component="button"
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 2,
                    py: 1,
                    borderRadius: 4, // 16px pill shape
                    border: 'none',
                    bgcolor: expanded ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.primary.main, 0.05),
                    color: theme.palette.primary.main,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                    }
                }}
            >
                <Typography
                    variant="body2"
                    sx={{
                        fontWeight: 600,
                        fontFamily: 'Google Sans, Inter, sans-serif',
                    }}
                >
                    Thinking Process
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    {messages.length} step{messages.length !== 1 ? 's' : ''}
                </Typography>
                <ExpandMoreIcon
                    sx={{
                        fontSize: 20,
                        ml: 0.5,
                        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
                    }}
                />
            </Box>

            {expanded && (
                <Stack spacing={2} sx={{ mt: 2, px: 1 }}>
                    {messages.map((msg, idx) => {
                        const toolName = (msg.custom_data?.call as any)?.name || msg.custom_data?.tool || 'Tool';
                        const isLast = idx === messages.length - 1;

                        return (
                            <Box key={idx} sx={{ position: 'relative', pl: 2 }}>
                                {/* Timeline line */}
                                {!isLast && (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            left: 9, // Centered with icon (16px icon + 2px padding -> center ~9)
                                            top: 24,
                                            bottom: -16,
                                            width: 2,
                                            bgcolor: 'divider',
                                        }}
                                    />
                                )}

                                <Stack direction="row" spacing={2} alignItems="flex-start">
                                    <CheckCircleIcon
                                        sx={{
                                            fontSize: 18,
                                            color: theme.palette.success.main,
                                            mt: 0.25,
                                            zIndex: 1,
                                            bgcolor: 'background.paper',
                                            borderRadius: '50%',
                                        }}
                                    />
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography variant="subtitle2" sx={{ fontSize: '0.9rem', fontWeight: 600, mb: 0.5 }}>
                                            Used {toolName}
                                        </Typography>
                                        <Box sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                                            {renderToolDetails(msg)}
                                        </Box>
                                    </Box>
                                </Stack>
                            </Box>
                        );
                    })}
                </Stack>
            )}
        </Box>
    );
}
