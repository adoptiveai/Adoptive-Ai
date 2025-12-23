'use client';

import { ChangeEvent, KeyboardEvent } from 'react';
import {
  Box,
  IconButton,
  OutlinedInput,
  Stack,
  Tooltip,
  Typography,
  Chip,
  Paper,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ClearIcon from '@mui/icons-material/Clear';
import { dt } from '@/config/displayTexts';
import type { UploadedFile } from '@/types/api';
import { useAuthStore } from '@/store/authStore';

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onQuickSubmit?: (message: string) => void;
  disabled?: boolean;
  selectedFiles: File[];
  onFilesSelected: (files: FileList) => void;
  onRemoveFile: (name: string) => void;
  attachedFiles: UploadedFile[];
  onDetachFile: (fileId: string) => void;
  onClearSuggestion?: () => void;
  suggestedCommand?: string;
}

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  onQuickSubmit,
  disabled,
  selectedFiles,
  onFilesSelected,
  onRemoveFile,
  attachedFiles,
  onDetachFile,
  onClearSuggestion,
  suggestedCommand,
}: ChatComposerProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!disabled) {
        onSubmit();
      }
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length) {
      onFilesSelected(files);
      event.target.value = '';
    }
  };

  const user = useAuthStore((state) => state.user);
  const canViewDocuments = user?.can_view_documents !== false;

  const allPrompts = [
    { label: 'Create a visualization graph', message: 'Create a visualization graph or chart using the above data.' },
    { label: 'Summarize key insights', message: 'Summarize the key insights from the documents.' },
    { label: 'Identify main trends', message: 'What are the main trends in this data?' },
    { label: 'View PDF', message: 'I want to view the PDF of the above data.', requiresViewPermission: true },
  ];

  // Filter out View PDF if user doesn't have view_doc permission
  const suggestedPrompts = allPrompts.filter(p => !p.requiresViewPermission || canViewDocuments);

  return (
    <Stack spacing={2} sx={{ px: 3, pb: 3, width: '100%' }}>
      {/* Suggested Prompts */}
      <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1, '::-webkit-scrollbar': { display: 'none' } }}>
        {suggestedPrompts.map((prompt) => (
          <Chip
            key={prompt.label}
            label={prompt.label}
            onClick={() => onQuickSubmit?.(prompt.message)}
            disabled={disabled}
            variant="outlined"
            clickable
            sx={{ borderRadius: 2 }}
          />
        ))}
      </Box>

      {/* Selected Files */}
      {(selectedFiles.length > 0 || attachedFiles.length > 0) && (
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {selectedFiles.map((file) => (
            <Chip key={file.name} label={file.name} onDelete={() => onRemoveFile(file.name)} size="small" />
          ))}
          {attachedFiles.map((file) => (
            <Chip
              key={file.id}
              label={file.filename}
              onDelete={() => onDetachFile(file.id)}
              size="small"
              color="primary"
              variant="outlined"
            />
          ))}
        </Stack>
      )}

      {/* Suggested Command Chip */}
      {suggestedCommand && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Suggested prompt loaded.
          </Typography>
          <Chip label={suggestedCommand} onDelete={onClearSuggestion} size="small" />
        </Box>
      )}

      {/* Chat Input Area */}
      <Paper
        elevation={3}
        sx={{
          p: '2px 4px',
          display: 'flex',
          alignItems: 'flex-end',
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Tooltip title={dt.FILE_TYPES || 'Attach files'}>
          <span>
            <IconButton component="label" disabled={disabled} sx={{ p: '10px' }}>
              <AttachFileIcon />
              <input hidden multiple type="file" onChange={handleFileChange} />
            </IconButton>
          </span>
        </Tooltip>

        <OutlinedInput
          multiline
          maxRows={6}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={dt.CHAT_INPUT_PLACEHOLDER || 'Ask me anything about your documents...'}
          fullWidth
          sx={{
            '& fieldset': { border: 'none' },
            '& .MuiInputBase-input': { py: 1.5 },
          }}
        />

        {value && (
          <IconButton onClick={() => onChange('')} disabled={disabled} sx={{ p: '10px' }}>
            <ClearIcon />
          </IconButton>
        )}

        <Tooltip title="Send">
          <span>
            <IconButton
              color="primary"
              onClick={onSubmit}
              disabled={disabled || (!value.trim() && selectedFiles.length === 0 && attachedFiles.length === 0)}
              sx={{ p: '10px' }}
            >
              <SendIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Paper>
    </Stack>
  );
}
