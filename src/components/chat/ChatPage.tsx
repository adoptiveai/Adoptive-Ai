'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Alert,
  Box,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { ConversationSidebar } from './ConversationSidebar';
import { ChatMessages } from './ChatMessages';
import { ChatComposer } from './ChatComposer';
import { ExamplePrompts } from './ExamplePrompts';
import { PdfViewerDialog } from './PdfViewerDialog';
import { FeedbackWidget } from './FeedbackWidget';
import { ModelSelector } from './ModelSelector';
import { ThemeToggle } from '../layout/ThemeToggle';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { agentClient } from '@/services/agentClient';
import type { ChatMessage, Conversation, ParsedStreamChunk, ToolCall } from '@/types/api';
import { dt } from '@/config/displayTexts';

const DEFAULT_AGENT = 'pg_rag_assistant';

export function ChatPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const nextThreadId = searchParams?.get('thread');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, startTransition] = useTransition();
  const [toolCalls, setToolCalls] = useState<Record<string, { name: string; args: Record<string, unknown> }>>({});
  const toolCallsRef = useRef(toolCalls);

  useEffect(() => {
    toolCallsRef.current = toolCalls;
  }, [toolCalls]);

  const streamingContentRef = useRef('');
  const lastUpdateRef = useRef<number>(0);

  const {
    user,
  } = useAuthStore();

  const {
    messages,
    currentThreadId,
    conversationTitle,
    setThreadId,
    setConversationTitle,
    setMessages,
    addMessage,
    updateLastMessage,
    replaceLastMessage,
    moveLastAiMessageToEnd,
    setLoading,
    setStreaming,
    setError,
    error,
    selectedFiles,
    addFile,
    removeFile,
    clearFiles,
    reset,
    conversations,
    setConversations,
    suggestedCommand,
    setSuggestedCommand,
    setPdfDialog,
    pdfDialog,
    attachedFiles,
    attachFile,
    detachFile,
    selectedModel,
  } = useChatStore();

  const userId = user?.id;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    // Only auto-open on desktop if it wasn't explicitly interacted with (simple logic for now)
    if (!isMobile) {
      setIsSidebarOpen(true);
    }
  }, [isMobile]);

  useEffect(() => {
    if (!currentThreadId) {
      const initial = nextThreadId ?? crypto.randomUUID();
      setThreadId(initial);
      if (!nextThreadId) {
        startTransition(() => {
          router.replace(`${pathname}?thread=${initial}`);
        });
      }
    }
  }, [currentThreadId, nextThreadId, pathname, router, setThreadId]);

  useEffect(() => {
    if (currentThreadId && nextThreadId !== currentThreadId) {
      startTransition(() => {
        const params = new URLSearchParams(searchParams?.toString());
        params.set('thread', currentThreadId);
        router.replace(`${pathname}?${params.toString()}`);
      });
    }
  }, [currentThreadId, nextThreadId, pathname, router, searchParams]);

  const { isFetching: isConversationsLoading, refetch: refetchConversations } = useQuery({
    queryKey: ['conversations', userId],
    queryFn: async () => {
      if (!userId) return [] as Conversation[];
      const res = await agentClient.getConversations(userId);
      setConversations(res.conversations ?? []);
      return res.conversations ?? [];
    },
    enabled: Boolean(userId),
    refetchOnWindowFocus: false,
  });

  const loadHistory = async (threadId: string) => {
    if (!userId) return;
    try {
      setLoading(true);
      const history = await agentClient.getHistory(threadId, userId);
      setMessages(history.messages ?? []);
      const title = await agentClient.getConversationTitle(threadId, userId).catch(() => dt.DEFAULT_CONVERSATION_TITLE);
      setConversationTitle(title);
    } catch (err) {
      console.error(err);
      toast.error(dt.CONVERSATION_LOAD_ERROR || 'Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId && currentThreadId && nextThreadId === currentThreadId) {
      loadHistory(currentThreadId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, currentThreadId]);

  const handleSelectConversation = async (threadId: string) => {
    if (!userId) return;
    if (threadId === currentThreadId) return;
    setThreadId(threadId);
    await loadHistory(threadId);
  };

  const handleNewConversation = () => {
    const threadId = crypto.randomUUID();
    reset(threadId);
    setMessages([]);
    setConversationTitle(dt.DEFAULT_CONVERSATION_TITLE);
    startTransition(() => {
      router.replace(`${pathname}?thread=${threadId}`);
    });
  };

  const handleRenameConversation = async (threadId: string, _current: string, title: string) => {
    if (!userId || !title) return;
    try {
      await agentClient.setConversationTitle(threadId, title, userId);
      if (threadId === currentThreadId) {
        setConversationTitle(title);
      }
      toast.success(dt.SAVE_TITLE_BUTTON || 'Saved');
      await refetchConversations();
    } catch (err) {
      console.error(err);
      toast.error(dt.LOAD_CONVERSATIONS_ERROR?.replace('{e}', 'rename failed') || 'Failed to rename conversation');
    }
  };

  const handleDeleteConversation = async (threadId: string) => {
    if (!userId) return;
    try {
      await agentClient.deleteConversation(threadId, userId);
      toast.success(dt.DELETE_DOCUMENT || 'Conversation deleted');
      await refetchConversations();
      if (threadId === currentThreadId) {
        handleNewConversation();
      }
    } catch (err) {
      console.error(err);
      toast.error(dt.LOAD_CONVERSATIONS_ERROR?.replace('{e}', 'delete failed') || 'Failed to delete conversation');
    }
  };

  const appendToolMessage = (message: ChatMessage) => {
    addMessage(message);
  };

  const processStreamChunk = async (chunk: ParsedStreamChunk) => {
    switch (chunk.type) {
      case 'content': {
        streamingContentRef.current += String(chunk.data ?? '');

        const now = Date.now();
        if (now - lastUpdateRef.current > 100) {
          updateLastMessage(streamingContentRef.current);
          lastUpdateRef.current = now;
        }
        break;
      }
      case 'final_content': {
        const content = String(chunk.data ?? '');
        streamingContentRef.current = content;
        updateLastMessage(content);
        break;
      }
      case 'tool_calls': {
        if (Array.isArray(chunk.data)) {
          const calls = chunk.data as ToolCall[];
          setToolCalls((prev) => {
            const updated = { ...prev };
            calls.forEach((call) => {
              if (call.id) {
                updated[call.id] = { name: call.name, args: call.args };
              }
            });
            toolCallsRef.current = updated;
            return updated;
          });

          calls.forEach((call) => {
            appendToolMessage({
              type: 'tool',
              content: dt.TOOL_CALL_STATUS
                ? dt.TOOL_CALL_STATUS.replace('{tool_name}', call.name)
                : `Running tool ${call.name}`,
              custom_data: {
                tool: 'status',
                call,
              },
            });
          });
        }
        break;
      }
      case 'tool_results': {
        if (Array.isArray(chunk.data)) {
          for (const result of chunk.data as Array<Record<string, unknown>>) {
            const toolCallId = String(result['tool_call_id'] ?? '');
            const content = result['content'];
            const toolInfo = toolCallsRef.current[toolCallId];
            const toolName = toolInfo?.name ?? 'tool';

            if (toolName === 'Graphing_Agent' && typeof content === 'string') {
              try {
                const graphRaw = await agentClient.getGraph(content.trim());
                const parsedGraph = typeof graphRaw === 'string' ? JSON.parse(graphRaw) : graphRaw;
                appendToolMessage({
                  type: 'tool',
                  content: dt.GRAPH_RETRIEVAL_STATUS?.replace('{graph_id}', content) || 'Graph generated',
                  custom_data: {
                    tool: 'graph',
                    graphId: content.trim(),
                    graph: parsedGraph,
                  },
                });
              } catch (error) {
                appendToolMessage({
                  type: 'tool',
                  content: dt.GRAPH_RETRIEVAL_ERROR?.replace('{e}', String(error)) || `Failed to fetch graph: ${error}`,
                });
              }
              continue;
            }

            if (toolName === 'PDF_Viewer' && typeof content === 'string') {
              try {
                const parsed = JSON.parse(content);
                appendToolMessage({
                  type: 'tool',
                  content: '',
                  custom_data: {
                    tool: 'pdf',
                    entries: parsed,
                    callId: toolCallId,
                  },
                });
              } catch (error) {
                appendToolMessage({
                  type: 'tool',
                  content: `PDF viewer returned invalid data: ${error}`,
                });
              }
              continue;
            }

            if (toolName === 'SQL_Executor' && typeof content === 'string') {
              appendToolMessage({
                type: 'tool',
                content: '',
                custom_data: {
                  tool: 'sql',
                  content,
                },
              });
              continue;
            }

            appendToolMessage({
              type: 'tool',
              content: typeof content === 'string' ? content : JSON.stringify(result, null, 2),
            });
          }
        }
        break;
      }
      case 'final_message': {
        if (typeof chunk.data === 'object' && chunk.data) {
          replaceLastMessage(chunk.data as ChatMessage);
        }
        break;
      }
      default:
        break;
    }
  };

  const handleFilesSelected = (files: FileList) => {
    Array.from(files).forEach((file) => addFile(file));
  };

  const handleSendMessage = async (customMessage?: string) => {
    if (!userId || !currentThreadId) {
      toast.error('User session missing.');
      return;
    }
    const messageToSend = customMessage || inputValue;
    if (!messageToSend.trim() && selectedFiles.length === 0 && attachedFiles.length === 0) return;

    setIsSubmitting(true);
    setLoading(true);
    setStreaming(true);
    setError(null);

    try {
      const humanMessage: ChatMessage = {
        type: 'human',
        content: messageToSend,
        attached_files: [...selectedFiles.map((file) => file.name), ...attachedFiles.map((file) => file.filename)],
      };
      addMessage(humanMessage);

      const uploadedFileIds: string[] = [];
      for (const file of selectedFiles) {
        try {
          const upload = await agentClient.uploadFile(file, { threadId: currentThreadId, userId });
          if (upload?.file_id) {
            uploadedFileIds.push(upload.file_id);
          }
        } catch (err) {
          console.error('File upload failed', err);
          toast.error(dt.FILE_UPLOAD_ERROR_STATUS?.replace('{file_name}', file.name).replace('{e}', String(err)) || `Failed to upload ${file.name}`);
        }
      }

      clearFiles();
      setInputValue('');
      setSuggestedCommand(undefined);

      const aiPlaceholder: ChatMessage = {
        type: 'ai',
        content: '',
      };
      addMessage(aiPlaceholder);

      // Reset streaming refs
      streamingContentRef.current = '';
      lastUpdateRef.current = 0;

      const stream = await agentClient.stream({
        message: messageToSend,
        model: selectedModel,
        thread_id: currentThreadId,
        file_ids: [...(uploadedFileIds.length ? uploadedFileIds : []), ...attachedFiles.map((f) => f.id)],
        user_id: userId,
        stream_tokens: true,
      }, DEFAULT_AGENT);

      for await (const chunk of agentClient.parseStream(stream)) {
        await processStreamChunk(chunk);
      }

      // Ensure final update for any throttled content
      if (streamingContentRef.current) {
        updateLastMessage(streamingContentRef.current);
      }

      moveLastAiMessageToEnd();

      // Generate title if it's a new conversation
      if (conversationTitle === dt.DEFAULT_CONVERSATION_TITLE) {
        try {
          // Generate title locally from user message (no backend call, no LangSmith trace)
          // Take first 40 chars, trim, and clean up
          let generatedTitle = messageToSend
            .replace(/\n/g, ' ')  // Replace newlines with spaces
            .trim()
            .slice(0, 40);

          // If truncated mid-word, try to cut at last space
          if (messageToSend.length > 40 && !generatedTitle.endsWith(' ')) {
            const lastSpace = generatedTitle.lastIndexOf(' ');
            if (lastSpace > 20) {
              generatedTitle = generatedTitle.slice(0, lastSpace);
            }
          }

          generatedTitle = generatedTitle.trim() || dt.DEFAULT_CONVERSATION_TITLE;

          await agentClient.setConversationTitle(currentThreadId, generatedTitle, userId);
          setConversationTitle(generatedTitle);
        } catch (titleErr) {
          console.error('Failed to save conversation title', titleErr);
          // Fallback: save the default title to ensure conversation is persisted
          await agentClient.setConversationTitle(currentThreadId, dt.DEFAULT_CONVERSATION_TITLE, userId);
        }
      }

      await refetchConversations();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : dt.RESPONSE_GENERATION_ERROR?.replace('{e}', String(err)) || 'Failed to get response';
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
      setLoading(false);
      setStreaming(false);
    }
  };

  const handlePromptSelect = (prompt: string) => {
    setInputValue(prompt);
    setSuggestedCommand(prompt);
  };

  const handleOpenPdf = (payload: { name: string; block_indices?: number[]; debug?: boolean; keywords?: string[] }) => {
    setPdfDialog({
      open: true,
      documentName: payload.name,
      debug: payload.debug,
      blockIndices: payload.block_indices,
      keywords: payload.keywords,
    });
  };

  const showExamplePrompts = messages.length === 0;
  const lastAiMessage = [...messages].reverse().find((message) => message.type === 'ai');

  return (
    <Box sx={{ display: 'flex', flex: 1, height: '100%', flexDirection: 'row', overflow: 'hidden' }}>
      <ConversationSidebar
        conversations={conversations}
        currentThreadId={currentThreadId}
        onSelect={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onRename={handleRenameConversation}
        onDelete={handleDeleteConversation}
        onRefresh={() => refetchConversations()}
        isLoading={isConversationsLoading}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        width={sidebarWidth}
        onWidthChange={setSidebarWidth}
        onAttachFile={attachFile}
      />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'background.default', minWidth: 0 }}>
        <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 1.5, md: 2 }, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper', display: 'flex', alignItems: 'center', gap: 2 }}>
          {!isSidebarOpen && (
            <IconButton onClick={() => setIsSidebarOpen(true)} edge="start" size="small">
              <MenuIcon />
            </IconButton>
          )}
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {conversationTitle || dt.DEFAULT_CONVERSATION_TITLE}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {dt.CAPTION || 'AdoptiveAI - AI Research Assistant'}
            </Typography>
          </Box>
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
            <ThemeToggle />
            <ModelSelector disabled={isSubmitting} />
          </Box>
        </Box>

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {showExamplePrompts ? (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
                  <ExamplePrompts onSelect={handlePromptSelect} />
                </Box>
              ) : (
                <>
                  <Stack sx={{ px: { xs: 2, md: 3 }, pt: 3 }} spacing={2}>
                    {error && <Alert severity="error">{error}</Alert>}
                  </Stack>
                  <ChatMessages messages={messages} onOpenPdf={handleOpenPdf} conversationId={currentThreadId} />
                </>
              )}
            </Box>
            <Box>
              <ChatComposer
                value={inputValue}
                onChange={setInputValue}
                onSubmit={() => handleSendMessage()}
                onQuickSubmit={handleSendMessage}
                disabled={isSubmitting}
                selectedFiles={selectedFiles}
                onFilesSelected={handleFilesSelected}
                onRemoveFile={removeFile}
                attachedFiles={attachedFiles}
                onDetachFile={detachFile}
                suggestedCommand={suggestedCommand}
                onClearSuggestion={() => setSuggestedCommand(undefined)}
              />
            </Box>
          </Box>
        </Box>
        <PdfViewerDialog
          open={Boolean(pdfDialog?.open && pdfDialog.documentName)}
          documentName={pdfDialog?.documentName}
          blockIndices={pdfDialog?.blockIndices}
          debug={pdfDialog?.debug}
          keywords={pdfDialog?.keywords}
          onClose={() => setPdfDialog(null)}
          userId={userId}
        />
      </Box>
    </Box>
  );
}
