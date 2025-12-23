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

    const isRunning = messages.some(m => !m.content && !m.custom_data); // Heuristic for running, though usually we have content.
    // Actually, in this system, 'tool' messages usually have content when done.
    // If we want to show "Thinking...", it's usually when we are waiting or have a list of tools.

    return (
        <Box sx={{ width: '100%', my: 1 }}>
            <Accordion
                expanded={expanded}
                onChange={(_, isExpanded) => setExpanded(isExpanded)}
                sx={{
                    boxShadow: 'none',
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    borderRadius: 2,
                    '&:before': { display: 'none' },
                    border: '1px solid',
                    borderColor: alpha(theme.palette.primary.main, 0.1),
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: theme.palette.primary.main }} />}
                    sx={{
                        minHeight: 48,
                        '& .MuiAccordionSummary-content': {
                            my: 1,
                            alignItems: 'center',
                            gap: 1.5,
                        },
                    }}
                >
                    {/* <AutoAwesomeIcon
                        sx={{
                            fontSize: 20,
                            color: theme.palette.primary.main,
                            animation: `${pulse} 2s infinite ease-in-out`,
                        }}
                    /> */}
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 600,
                            color: theme.palette.primary.main,
                            fontFamily: 'Google Sans, Inter, sans-serif',
                        }}
                    >
                        Thinking Process
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {messages.length} step{messages.length !== 1 ? 's' : ''}
                    </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0, pb: 2, px: 2 }}>
                    <Stack spacing={2} sx={{ mt: 1 }}>
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
                                                left: 3,
                                                top: 24,
                                                bottom: -16,
                                                width: 2,
                                                bgcolor: 'divider',
                                            }}
                                        />
                                    )}

                                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                        <CheckCircleIcon
                                            sx={{
                                                fontSize: 16,
                                                color: theme.palette.success.main,
                                                mt: 0.5,
                                                zIndex: 1,
                                                bgcolor: 'background.paper',
                                                borderRadius: '50%',
                                            }}
                                        />
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                                Used {toolName}
                                            </Typography>
                                            <Box sx={{ mt: 0.5, color: 'text.secondary', fontSize: '0.85rem' }}>
                                                {renderToolDetails(msg)}
                                            </Box>
                                        </Box>
                                    </Stack>
                                </Box>
                            );
                        })}
                    </Stack>
                </AccordionDetails>
            </Accordion>
        </Box>
    );
}
