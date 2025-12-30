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
  Drawer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  Typography,
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

import { useEffect } from 'react';
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
