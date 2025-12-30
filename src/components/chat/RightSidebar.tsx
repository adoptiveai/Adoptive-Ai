'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    IconButton,
    Divider,
    Stack,
    Paper,
    Tooltip,
    useTheme,
    useMediaQuery,
    Drawer,
    IconButton as MuiIconButton,
    Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { agentClient } from '@/services/agentClient';
import type { UploadedFile } from '@/types/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

interface RightSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    width: number;
    onWidthChange: (width: number) => void;
    currentThreadId: string | null;
    onAttachFile: (file: UploadedFile) => void;
}

export function RightSidebar({
    isOpen,
    onClose,
    width,
    onWidthChange,
    currentThreadId,
    onAttachFile,
}: RightSidebarProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [isResizing, setIsResizing] = useState(false);
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuthStore();
    const userId = user?.id;

    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            // Calculate width from the right edge of the screen
            const newWidth = Math.max(240, Math.min(600, window.innerWidth - e.clientX));
            onWidthChange(newWidth);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.style.cursor = 'default';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'col-resize';

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
        };
    }, [isResizing, onWidthChange]);

    const fetchFiles = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const fetchedFiles = await agentClient.getFiles(userId);
            setFiles(fetchedFiles);
        } catch (error) {
            console.error("Failed to fetch files:", error);
            toast.error("Failed to load files");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && userId) {
            fetchFiles();
        }
    }, [isOpen, userId]);

    const handleAttach = (file: UploadedFile) => {
        onAttachFile(file);
        toast.success('File attached to chat');
    };

    const SidebarContent = (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'background.paper',
                whiteSpace: 'nowrap',
                position: 'relative',
                minWidth: isMobile ? 280 : undefined,
            }}
        >
            {!isMobile && isOpen && (
                <Box
                    onMouseDown={() => setIsResizing(true)}
                    sx={{
                        position: 'absolute',
                        left: -4,
                        top: 0,
                        bottom: 0,
                        width: 8,
                        cursor: 'col-resize',
                        zIndex: 10,
                        '&:hover': {
                            backgroundColor: 'primary.main',
                            opacity: 0.5,
                        },
                        ...(isResizing && {
                            backgroundColor: 'primary.main',
                            opacity: 0.5,
                        }),
                    }}
                />
            )}

            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight={600}>
                    My Documents
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </Box>

            <Divider />

            <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
                {loading ? (
                    <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
                        Loading documents...
                    </Typography>
                ) : files.length === 0 ? (
                    <Box sx={{ textAlign: 'center', mt: 4 }}>
                        <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                        <Typography variant="body2" color="text.secondary">
                            No documents uploaded yet.
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                            Upload files in the chat to see them here.
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={1.5}>
                        {files.map((file) => (
                            <Paper
                                key={file.id}
                                elevation={0}
                                sx={{
                                    p: 1.5,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                        bgcolor: 'action.hover',
                                        transform: 'translateY(-1px)',
                                        boxShadow: 1
                                    }
                                }}
                            >
                                <Box
                                    sx={{
                                        p: 1,
                                        borderRadius: 1.5,
                                        bgcolor: 'primary.light',
                                        color: 'primary.main',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <InsertDriveFileIcon fontSize="small" />
                                </Box>

                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="body2" noWrap fontWeight={500}>
                                        {file.filename}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        {file.file_size ? `${(file.file_size / 1024).toFixed(1)} KB` : 'Document'}
                                    </Typography>
                                </Box>

                                <Tooltip title="Attach to conversation">
                                    <span>
                                        <MuiIconButton
                                            size="small"
                                            onClick={() => handleAttach(file)}
                                            disabled={!currentThreadId}
                                            color="primary"
                                            sx={{
                                                bgcolor: 'background.paper',
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                '&:hover': {
                                                    bgcolor: 'primary.main',
                                                    color: 'primary.contrastText',
                                                    borderColor: 'primary.main'
                                                }
                                            }}
                                        >
                                            <AttachFileIcon fontSize="small" />
                                        </MuiIconButton>
                                    </span>
                                </Tooltip>
                            </Paper>
                        ))}
                    </Stack>
                )}
            </Box>
        </Box>
    );

    if (isMobile) {
        return (
            <Drawer
                variant="temporary"
                anchor="right"
                open={isOpen}
                onClose={onClose}
                ModalProps={{ keepMounted: true }}
                sx={{
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: '85vw',
                        maxWidth: 360
                    },
                }}
            >
                {SidebarContent}
            </Drawer>
        );
    }

    return (
        <Box
            sx={{
                width: isOpen ? width : 0,
                transition: isResizing ? 'none' : 'width 0.3s ease',
                overflow: isOpen ? 'visible' : 'hidden',
                borderLeft: isOpen ? '1px solid' : 'none',
                borderColor: 'divider',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'background.paper',
                whiteSpace: 'nowrap',
                position: 'relative',
            }}
        >
            {SidebarContent}
        </Box>
    );
}
