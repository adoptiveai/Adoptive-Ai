'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import {
  Avatar,
  Box,
  Chip,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import MarkUnreadChatAltIcon from '@mui/icons-material/MarkUnreadChatAlt';
import ArticleIcon from '@mui/icons-material/Article';
import type { ChatMessage } from '@/types/api';
import dynamic from 'next/dynamic';
import { SqlResultsTable } from './SqlResultsTable';
import { ThinkingIndicator } from './ThinkingIndicator';
import { ThinkingProcess } from './ThinkingProcess';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
// Dynamically import GraphViewer to avoid SSR issues with Plotly
const GraphViewer = dynamic(() => import('./GraphViewer').then((mod) => mod.GraphViewer), {
  ssr: false,
  loading: () => <Box sx={{ p: 2 }}>Loading graph...</Box>,
});
// Dynamically import InteractiveChart to avoid SSR issues
const InteractiveChart = dynamic(() => import('./InteractiveChart').then((mod) => mod.InteractiveChart), {
  ssr: false,
  loading: () => <Box sx={{ p: 2 }}>Loading interactive chart...</Box>,
});
import { FeedbackWidget } from './FeedbackWidget';
import { dt } from '@/config/displayTexts';
import { Button } from '@mui/material';
import { Typewriter } from './Typewriter';

interface ChatMessagesProps {
  messages: ChatMessage[];
  onOpenPdf?: (payload: { name: string; block_indices?: number[]; debug?: boolean; keywords?: string[] }) => void;
  conversationId?: string | null;
}

const aiIcon = dt.AI_ICON || '🤖';
const userIcon = dt.USER_ICON || '👤';

interface PdfEntry {
  pdf_file: string;
  block_indices?: number[];
  debug?: boolean;
  keywords?: string[];
}

import type { GraphViewerProps } from './GraphViewer';

type GraphFigure = GraphViewerProps['figure'];

export function ChatMessages({ messages, onOpenPdf, conversationId }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const user = useAuthStore((state) => state.user);
  const isStreaming = useChatStore((state) => state.isStreaming);
  const canViewDocuments = user?.can_view_documents !== false; // Default true if not set

  const lastConversationId = useRef<string | null>(null);

  useEffect(() => {
    const isNewConversation = conversationId !== lastConversationId.current;
    lastConversationId.current = conversationId ?? null;

    bottomRef.current?.scrollIntoView({
      behavior: isNewConversation ? 'auto' : 'smooth',
    });
  }, [messages, conversationId]);

  const renderJsonEntry = (entry: unknown, index: number) => {
    if (!entry || typeof entry !== 'object') {
      return (
        <Typography key={index} variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {typeof entry === 'string' ? entry : JSON.stringify(entry, null, 2)}
        </Typography>
      );
    }

    // Simplified JSON rendering for inside the thinking process
    return (
      <Typography key={`entry-${index}`} variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
        {JSON.stringify(entry, null, 2)}
      </Typography>
    );
  };

  const renderStructuredContent = (rawContent: string, options: { showFallback?: boolean } = {}) => {
    const showFallback = options.showFallback ?? true;

    if (!rawContent) {
      return showFallback ? (
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          No tool output
        </Typography>
      ) : null;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      return (
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {rawContent}
        </Typography>
      );
    }

    if (parsed && typeof parsed === 'object' && 'error' in parsed) {
      return (
        <Typography variant="body2" color="error" sx={{ whiteSpace: 'pre-wrap' }}>
          {(parsed as { error: string }).error}
        </Typography>
      );
    }

    if (Array.isArray(parsed)) {
      return (
        <Stack spacing={1}>
          {parsed.map((entry, idx) => renderJsonEntry(entry, idx))}
        </Stack>
      );
    }

    if (parsed && typeof parsed === 'object') {
      return (
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(parsed, null, 2)}
        </Typography>
      );
    }

    return (
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
        {String(parsed)}
      </Typography>
    );
  };

  const getToolType = (message: ChatMessage): string => {
    const rawTool = message.custom_data?.tool;
    return typeof rawTool === 'string' ? rawTool : 'generic';
  };

  const renderToolDetails = (message: ChatMessage) => {
    const toolType = getToolType(message);
    const details: ReactNode[] = [];

    if (toolType === 'status') {
      const call = message.custom_data?.call as { args?: unknown } | undefined;
      if (call?.args !== undefined) {
        details.push(
          <Box key="status-args">
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Input Arguments
            </Typography>
            <Box
              component="pre"
              sx={{
                bgcolor: 'action.hover',
                p: 1.5,
                borderRadius: 1,
                overflowX: 'auto',
                fontSize: '0.85rem',
              }}
            >
              {JSON.stringify(call.args, null, 2)}
            </Box>
          </Box>
        );
      }
    }

    if ((toolType === 'graph' || toolType === 'graphing_agent') && message.custom_data?.graph) {
      const graphFigure = message.custom_data.graph as GraphFigure;
      if (graphFigure && Array.isArray(graphFigure.data)) {
        details.push(
          <Box key="graph-container">
            <GraphViewer key="graph" figure={graphFigure} />
            <InteractiveChart key="interactive-chart" figure={graphFigure} />
          </Box>
        );
      }
    }

    if ((toolType === 'pdf' || toolType === 'pdf_viewer') && Array.isArray(message.custom_data?.entries)) {
      details.push(
        <Stack key="pdf" spacing={1.5}>
          {(message.custom_data.entries as PdfEntry[]).map((entry, idx) => (
            <Paper key={idx} variant="outlined" sx={{ p: 1.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="subtitle2">{entry.pdf_file}</Typography>
                  {entry.block_indices && (
                    <Typography variant="caption" color="text.secondary">
                      Blocks: {entry.block_indices.join(', ')}
                    </Typography>
                  )}
                </Box>
                {canViewDocuments && (
                  <Button
                    variant="outlined"
                    startIcon={<ArticleIcon />}
                    onClick={() =>
                      onOpenPdf?.({
                        name: entry.pdf_file,
                        block_indices: entry.block_indices,
                        debug: entry.debug,
                        keywords: entry.keywords,
                      })
                    }
                  >
                    {dt.VIEW_DOCUMENT || 'View PDF'}
                  </Button>
                )}
              </Stack>
            </Paper>
          ))}
        </Stack>
      );
    }

    if (toolType === 'sql' || toolType === 'sql_executor') {
      const sqlContent =
        (typeof message.custom_data?.content === 'string' ? message.custom_data.content : undefined) ??
        (typeof message.content === 'string' ? message.content : '');
      if (sqlContent) {
        details.push(<SqlResultsTable key="sql" content={sqlContent} />);
      }
    }

    const structured = renderStructuredContent(message.content || '', { showFallback: details.length === 0 });
    if (structured) {
      details.push(<Box key="structured">{structured}</Box>);
    }

    if (details.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary">
          No tool output
        </Typography>
      );
    }

    return <Stack spacing={1.5}>{details}</Stack>;
  };

  // Group messages
  const groupedMessages: (ChatMessage | ChatMessage[])[] = [];
  let currentToolGroup: ChatMessage[] = [];
  let pendingAiMessage: ChatMessage | null = null;
  let pendingPdfSources: ChatMessage[] = [];
  let pendingGraphs: ChatMessage[] = [];

  messages.forEach((msg, index) => {
    // Skip empty AI messages that are not the last message (historical intermediate states)
    // This prevents them from breaking tool groups or flushing PDF buffers prematurely
    const isLast = index === messages.length - 1;
    const content = msg.content?.trim();
    if (msg.type === 'ai' && (!content || content === '**') && !isLast) {
      return;
    }

    const toolType = getToolType(msg);
    const isPdfTool = msg.type === 'tool' && (toolType === 'pdf' || toolType === 'pdf_viewer');
    const isGraphTool = msg.type === 'tool' && (toolType === 'graph' || toolType === 'graphing_agent');

    if (msg.type === 'tool') {
      if (isPdfTool) {
        pendingPdfSources.push(msg);
      } else if (isGraphTool) {
        pendingGraphs.push(msg);
      } else {
        currentToolGroup.push(msg);
      }
    } else if (msg.type === 'ai') {
      // If we have a previous pending AI or tools, flush them
      if (currentToolGroup.length > 0) {
        groupedMessages.push(currentToolGroup);
        currentToolGroup = [];
      }

      // Flush Graphs BEFORE AI
      if (pendingGraphs.length > 0) {
        pendingGraphs.forEach(g => groupedMessages.push(g));
        pendingGraphs = [];
      }

      if (pendingAiMessage) {
        groupedMessages.push(pendingAiMessage);
        // Flush PDF sources after AI
        if (pendingPdfSources.length > 0) {
          pendingPdfSources.forEach(p => groupedMessages.push(p));
          pendingPdfSources = [];
        }
        pendingAiMessage = null;
      }

      // Now set this new AI as pending
      pendingAiMessage = msg;

    } else {
      // User or System or Custom
      // Flush everything
      if (currentToolGroup.length > 0) {
        groupedMessages.push(currentToolGroup);
        currentToolGroup = [];
      }

      // Flush Graphs
      if (pendingGraphs.length > 0) {
        pendingGraphs.forEach(g => groupedMessages.push(g));
        pendingGraphs = [];
      }

      if (pendingAiMessage) {
        groupedMessages.push(pendingAiMessage);
        if (pendingPdfSources.length > 0) {
          pendingPdfSources.forEach(p => groupedMessages.push(p));
          pendingPdfSources = [];
        }
        pendingAiMessage = null;
      }
      if (pendingPdfSources.length > 0) {
        pendingPdfSources.forEach(p => groupedMessages.push(p));
        pendingPdfSources = [];
      }

      groupedMessages.push(msg);
    }
  });

  // Final flush
  if (currentToolGroup.length > 0) {
    groupedMessages.push(currentToolGroup);
  }

  if (pendingGraphs.length > 0) {
    pendingGraphs.forEach(g => groupedMessages.push(g));
  }

  if (pendingAiMessage) {
    groupedMessages.push(pendingAiMessage);
    if (pendingPdfSources.length > 0) {
      pendingPdfSources.forEach(p => groupedMessages.push(p));
    }
  } else if (pendingPdfSources.length > 0) {
    pendingPdfSources.forEach(p => groupedMessages.push(p));
  }

  return (
    <Stack spacing={2} sx={{ flex: 1, overflowY: 'auto', px: { xs: 3, md: 3 }, py: { xs: 2, md: 4 } }}>
      {groupedMessages.map((groupOrMessage, index) => {
        if (Array.isArray(groupOrMessage)) {
          // It's a group of tool messages
          return (
            <Stack key={`tool-group-${index}`} direction="row" spacing={2} alignItems="flex-start">
              <Avatar sx={{ bgcolor: 'secondary.main', color: 'secondary.contrastText' }}>{aiIcon}</Avatar>
              <Box sx={{ maxWidth: { xs: '90%', md: '80%' }, width: '100%' }}>
                <ThinkingProcess
                  messages={groupOrMessage}
                  renderToolDetails={renderToolDetails}
                />
              </Box>
            </Stack>
          );
        }

        const message = groupOrMessage;

        if (message.type === 'human') {
          return (
            <Stack key={index} direction="row" justifyContent="flex-end" spacing={2}>
              <Stack spacing={1} alignItems="flex-end" maxWidth={{ xs: '85%', md: '70%' }}>
                {message.attached_files?.length ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
                    {message.attached_files.map((file) => (
                      <Chip key={file} label={dt.FILE_ATTACHED_BADGE?.replace('{file_name}', file) || file} size="small" />
                    ))}
                  </Stack>
                ) : null}
                <Paper
                  elevation={0}
                  sx={{
                    px: 3,
                    py: 1.5,
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    borderRadius: '24px', // Bubbly shape
                    borderTopRightRadius: '4px', // Distinct user styling
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)', // Soft shadow
                  }}
                >
                  <Typography variant="body1">{message.content}</Typography>
                </Paper>
              </Stack>
              <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>{userIcon}</Avatar>
            </Stack>
          );
        }

        if (message.type === 'tool') {
          // This must be a standalone tool (like the PDF viewer we pulled out)
          // Render it nicely
          const toolType = getToolType(message);

          if ((toolType === 'pdf' || toolType === 'pdf_viewer') && Array.isArray(message.custom_data?.entries)) {
            return (
              <Stack key={index} direction="row" spacing={2} alignItems="flex-start">
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                  <ArticleIcon />
                </Avatar>
                <Stack spacing={1.5} sx={{ maxWidth: { xs: '85%', md: '70%' }, width: '100%' }}>
                  {(message.custom_data.entries as PdfEntry[]).map((entry, idx) => (
                    <Paper key={idx} elevation={2} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle2" noWrap title={entry.pdf_file}>
                            {entry.pdf_file}
                          </Typography>
                        </Box>
                        {canViewDocuments && (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<ArticleIcon />}
                            onClick={() =>
                              onOpenPdf?.({
                                name: entry.pdf_file,
                                block_indices: entry.block_indices,
                                debug: entry.debug,
                                keywords: entry.keywords,
                              })
                            }
                            sx={{ whiteSpace: 'nowrap' }}
                          >
                            {dt.VIEW_DOCUMENT || 'View PDF'}
                          </Button>
                        )}
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Stack>
            );
          }

          if ((toolType === 'graph' || toolType === 'graphing_agent') && message.custom_data?.graph) {
            const graphFigure = message.custom_data.graph as GraphFigure;
            return (
              <Stack key={index} direction="row" spacing={2} alignItems="flex-start">
                <Avatar sx={{ bgcolor: 'secondary.main', color: 'secondary.contrastText' }}>{aiIcon}</Avatar>
                <Box sx={{ maxWidth: { xs: '85%', md: '80%' }, width: '100%' }}>
                  <GraphViewer figure={graphFigure} />
                  <InteractiveChart figure={graphFigure} />
                </Box>
              </Stack>
            );
          }

          // Fallback for other standalone tools
          return (
            <Stack key={`tool-single-${index}`} direction="row" spacing={2} alignItems="flex-start">
              <Avatar sx={{ bgcolor: 'secondary.main', color: 'secondary.contrastText' }}>{aiIcon}</Avatar>
              <Box sx={{ maxWidth: { xs: '90%', md: '80%' }, width: '100%' }}>
                <ThinkingProcess
                  messages={[message]}
                  renderToolDetails={renderToolDetails}
                />
              </Box>
            </Stack>
          );
        }

        if (message.type === 'custom') {
          return (
            <Stack key={index} direction="row" spacing={2} alignItems="flex-start">
              <Avatar sx={{ bgcolor: 'grey.200', color: 'grey.800' }}>
                <MarkUnreadChatAltIcon />
              </Avatar>
              <Paper elevation={1} sx={{ px: 2.5, py: 2, borderRadius: 3, maxWidth: { xs: '85%', md: '70%' } }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {message.content}
                </Typography>
              </Paper>
            </Stack>
          );
        }

        if (message.type === 'system') {
          return null;
        }

        // Default AI message
        if (message.content?.trim() === '**') {
          return null;
        }

        // Filter out empty AI messages unless it's the last message
        // This prevents "loading" indicators from showing up for historical empty messages
        const isLastMessage = index === groupedMessages.length - 1;
        if (!message.content && !isLastMessage) {
          return null;
        }

        return (
          <Stack key={index} direction="row" spacing={2} alignItems="flex-start">
            <Avatar sx={{ bgcolor: 'secondary.main', color: 'secondary.contrastText' }}>{aiIcon}</Avatar>
            <Paper
              elevation={0}
              sx={{
                px: 3,
                py: 2.5,
                borderRadius: '24px',
                borderTopLeftRadius: '4px', // Distinct AI styling
                maxWidth: { xs: '85%', md: '70%' },
                bgcolor: 'background.paper', // Ensure it stands out if on gray bg
                border: '1px solid',
                borderColor: 'divider',
                mt: 1.5, // Increased adjustment for alignment
              }}
            >
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {message.content ? (
                  isLastMessage && message.type === 'ai' && isStreaming ? (
                    <Typewriter content={message.content} speed={5} />
                  ) : (
                    message.content
                  )
                ) : (
                  <ThinkingIndicator />
                )}
              </Typography>
              {message.run_id && (
                <FeedbackWidget
                  runId={message.run_id}
                  conversationId={conversationId}
                  latestMessage={typeof message.content === 'string' ? message.content : null}
                  variant="icon"
                />
              )}
            </Paper>
          </Stack>
        );
      })}
      <Box ref={bottomRef} />
    </Stack>
  );
}