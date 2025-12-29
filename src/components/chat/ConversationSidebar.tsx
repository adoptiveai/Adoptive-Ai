'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import FeedbackIcon from '@mui/icons-material/Feedback';
import { useAuthStore } from '@/store/authStore';
import type { Conversation } from '@/types/api';
import { dt } from '@/config/displayTexts';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

import Image from 'next/image';
import { useEffect } from 'react';
import { agentClient } from '@/services/agentClient';
import type { UploadedFile } from '@/types/api';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { Accordion, AccordionSummary, AccordionDetails, Paper, IconButton as MuiIconButton, useTheme, useMediaQuery, Drawer } from '@mui/material';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface ConversationSidebarProps {
  conversations: Conversation[];
  currentThreadId: string | null;
  onSelect: (threadId: string) => void;
  onNewConversation: () => void;
  onRename: (threadId: string, currentTitle: string, newTitle: string) => Promise<void>;
  onDelete: (threadId: string) => Promise<void>;
  onRefresh: () => void;
  isLoading: boolean;
  isOpen: boolean;
  onToggle: () => void;
  width: number;
  onWidthChange: (width: number) => void;
  onAttachFile: (file: UploadedFile) => void;
}

export function ConversationSidebar({
  conversations,
  currentThreadId,
  onSelect,
  onNewConversation,
  onRename,
  onDelete,
  onRefresh,
  isLoading,
  isOpen,
  onToggle,
  width,
  onWidthChange,
  onAttachFile,
}: ConversationSidebarProps) {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [renameDialog, setRenameDialog] = useState<{ threadId: string; title: string } | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(240, Math.min(600, e.clientX));
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

  const handleRenameSubmit = async () => {
    if (!renameDialog) return;
    await onRename(renameDialog.threadId, renameDialog.title, newTitle.trim());
    setRenameDialog(null);
    setNewTitle('');
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await onDelete(deleteConfirm);
    setDeleteConfirm(null);
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
            right: -4,
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
        <Typography variant="h5" fontWeight={800} sx={{ color: 'primary.main', letterSpacing: '-0.5px' }}>
          AdoptiveAI
        </Typography>
        <Box>
          <ThemeToggle />
          <Tooltip title="Profile">
            <IconButton onClick={() => router.push('/profile')} size="small">
              <PersonIcon />
            </IconButton>
          </Tooltip>
          {!isMobile && (
            <IconButton onClick={onToggle} size="small">
              <MenuOpenIcon />
            </IconButton>
          )}
          {isMobile && (
            <IconButton onClick={onToggle} size="small">
              <MenuOpenIcon sx={{ transform: 'rotate(180deg)' }} />
            </IconButton>
          )}
        </Box>
      </Box>

      <Divider />
      <Box sx={{ p: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onNewConversation}
            fullWidth
            disabled={isLoading}
          >
            {dt.NEW_CONVERSATION_BUTTON}
          </Button>
          <Tooltip title={dt.REFRESH || 'Refresh'}>
            <span>
              <IconButton onClick={onRefresh} disabled={isLoading}>
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Box>

      <Divider />

      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {conversations.length === 0 ? (
          <Box sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              {dt.NO_RESULTS || 'No conversations yet. Start a new chat!'}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {conversations.map((conversation) => {
              const selected = conversation.thread_id === currentThreadId;
              const updatedAt = conversation.updated_at
                ? new Date(conversation.updated_at).toLocaleString()
                : undefined;
              return (
                <ListItem key={conversation.thread_id} disablePadding>
                  <ListItemButton
                    selected={selected}
                    onClick={() => onSelect(conversation.thread_id)}
                    sx={{ pr: 9 }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="body2" noWrap title={conversation.title || dt.DEFAULT_CONVERSATION_TITLE}>
                          {conversation.title || dt.DEFAULT_CONVERSATION_TITLE}
                        </Typography>
                      }
                      secondary={
                        updatedAt ? (
                          <Typography variant="caption" color="text.secondary" noWrap display="block">
                            {dt.CONVERSATION_LAST_UPDATED_HELP?.replace('{date_str}', updatedAt)}
                          </Typography>
                        ) : undefined
                      }
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title={dt.EDIT_CONVERSATION_TITLE_HELP || 'Rename'}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setRenameDialog({ threadId: conversation.thread_id, title: conversation.title });
                            setNewTitle(conversation.title);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={dt.DELETE_CONVERSATION_HELP || 'Delete'}>
                        <IconButton
                          size="small"
                          onClick={() => setDeleteConfirm(conversation.thread_id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
      </Box>

      <Dialog open={Boolean(renameDialog)} onClose={() => setRenameDialog(null)}>
        <DialogTitle>{dt.EDIT_TITLE_INPUT_LABEL}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            margin="dense"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialog(null)}>{dt.CANCEL_TITLE_BUTTON}</Button>
          <Button onClick={handleRenameSubmit} variant="contained" disabled={!newTitle.trim()}>
            {dt.SAVE_TITLE_BUTTON}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>{dt.CONFIRM_DELETE}</DialogTitle>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>{dt.CANCEL}</Button>
          <Button color="error" onClick={handleDelete} variant="contained">
            {dt.DELETE}
          </Button>
        </DialogActions>
      </Dialog>

      <Divider />

      <Box sx={{ p: 2 }}>
        <MyDocumentsSection
          currentThreadId={currentThreadId}
          onAttach={onAttachFile}
        />
      </Box>

      <Divider />

      <Box sx={{ p: 2 }}>
        <Stack spacing={1}>
          <Button
            variant="text"
            startIcon={<FeedbackIcon />}
            onClick={() => router.push('/feedback')}
            fullWidth
            sx={{ justifyContent: 'flex-start', color: 'text.secondary' }}
          >
            {dt.FEEDBACK || 'Feedback'}
          </Button>
          <Button
            variant="text"
            startIcon={<LogoutIcon />}
            onClick={() => {
              logout();
              window.location.href = '/login';
            }}
            fullWidth
            sx={{ justifyContent: 'flex-start', color: 'error.main' }}
          >
            {dt.LOGOUT || 'Sign Out'}
          </Button>
        </Stack>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={isOpen}
        onClose={onToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 300 },
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
        borderRight: isOpen ? '1px solid' : 'none',
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

function MyDocumentsSection({ currentThreadId, onAttach }: { currentThreadId: string | null, onAttach: (file: UploadedFile) => void }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  // TODO: Get actual user ID from context/auth
  const userId = "00000000-0000-0000-0000-000000000001";

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      try {
        const fetchedFiles = await agentClient.getFiles(userId);
        setFiles(fetchedFiles);
      } catch (error) {
        console.error("Failed to fetch files:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, [userId]);

  const handleAttach = (file: UploadedFile) => {
    onAttach(file);
    toast.success('File attached to chat');
  };

  if (files.length === 0) return null;

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1, px: 1, fontWeight: 600, color: 'text.primary' }}>
        My Documents
      </Typography>
      <Accordion
        disableGutters
        elevation={0}
        defaultExpanded
        sx={{
          '&:before': { display: 'none' },
          bgcolor: 'transparent'
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            minHeight: 40,
            px: 1,
            '& .MuiAccordionSummary-content': { margin: '8px 0' }
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {files.length} uploaded file{files.length !== 1 ? 's' : ''}
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          <Box sx={{ maxHeight: 300, overflowY: 'auto', px: 1, pb: 2 }}>
            <Stack spacing={1}>
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
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
