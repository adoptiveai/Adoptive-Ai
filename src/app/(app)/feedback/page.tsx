'use client';

import { useState } from 'react';
import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import toast from 'react-hot-toast';
import { dt } from '@/config/displayTexts';
import { agentClient } from '@/services/agentClient';
import { useAuthStore } from '@/store/authStore';

export default function FeedbackPage() {
  const { user } = useAuthStore();
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error('Authentication required');
      return;
    }
    if (!value.trim()) {
      toast.error('Please enter feedback');
      return;
    }
    setSubmitting(true);
    try {
      await agentClient.submitUserFeedback({ user_id: user.id, feedback_content: value.trim() });
      toast.success(dt.FEEDBACK_SUBMITTED_TOAST || 'Feedback submitted');
      setValue('');
    } catch (error) {
      toast.error(dt.FEEDBACK_SAVE_ERROR?.replace('{e}', String(error)) || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 720, margin: '0 auto' }}>
      <Paper elevation={2} sx={{ p: { xs: 3, md: 4 } }}>
        <Stack spacing={3}>
          <Typography variant="h5" fontWeight={600}>
            {dt.FEEDBACK || 'Feedback'}
          </Typography>
          <TextField
            multiline
            minRows={6}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={dt.FEEDBACK_DIALOG || 'Let us know what you think'}
          />
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
            {dt.FEEDBACK_SUBMIT_BUTTON || 'Submit feedback'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
