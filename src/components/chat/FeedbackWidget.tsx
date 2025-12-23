'use client';

import { useState } from 'react';
import { Box, Button, Rating, Stack, TextField, Typography } from '@mui/material';
import toast from 'react-hot-toast';
import { agentClient } from '@/services/agentClient';
import { dt } from '@/config/displayTexts';

interface FeedbackWidgetProps {
  runId?: string | null;
  conversationId?: string | null;
  latestMessage?: string | null;
}

export function FeedbackWidget({ runId, conversationId, latestMessage, variant = 'default' }: FeedbackWidgetProps & { variant?: 'default' | 'icon' }) {
  const [stars, setStars] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);

  if (!runId) return null;

  const handleSubmit = async () => {
    if (stars === null) {
      toast.error('Please select a rating');
      return;
    }
    setSubmitting(true);
    try {
      await agentClient.createFeedback({
        run_id: runId,
        key: comment ? 'human-feedback-with-comment' : 'human-feedback-stars',
        score: (stars ?? 0) / 5,
        conversation_id: conversationId ?? undefined,
        commented_message_text: latestMessage ?? undefined,
        kwargs: comment ? { comment } : {},
      });
      toast.success('Feedback saved');
      setSubmitted(true);
      if (variant === 'icon') {
        setShowCommentInput(false);
      }
    } catch (error) {
      toast.error(dt.FEEDBACK_SAVE_ERROR?.replace('{e}', String(error)) || 'Failed to save feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (variant === 'icon') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
        <Rating
          name={`feedback-${runId}`}
          value={stars}
          max={5}
          size="small"
          onChange={(_, value) => {
            setStars(value);
            setSubmitted(false);
            if (value !== null) {
              setShowCommentInput(true);
            }
          }}
        />
        {showCommentInput && !submitted && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              size="small"
              placeholder="Optional comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              sx={{ '& .MuiInputBase-input': { py: 0.5, fontSize: '0.875rem' } }}
            />
            <Button
              size="small"
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting}
              sx={{ minWidth: 'auto', px: 1.5, py: 0.5 }}
            >
              Submit
            </Button>
          </Box>
        )}
        {submitted && (
          <Typography variant="caption" color="success.main">
            Thanks!
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
      <Stack spacing={1.5}>
        <Typography variant="subtitle2">{dt.FEEDBACK || 'Feedback'}</Typography>
        <Rating
          name="chat-feedback"
          value={stars}
          max={5}
          onChange={(_, value) => {
            setStars(value);
            setSubmitted(false);
          }}
        />
        <TextField
          multiline
          minRows={2}
          maxRows={4}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Leave an optional comment"
        />
        <Button variant="contained" onClick={handleSubmit} disabled={submitting || submitted}>
          {submitted ? 'Submitted' : 'Submit'}
        </Button>
      </Stack>
    </Box>
  );
}
