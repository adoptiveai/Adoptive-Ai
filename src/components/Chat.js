import React, { useState, useEffect, useRef } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonIcon from '@mui/icons-material/Person';
import ReplayIcon from '@mui/icons-material/Replay';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';

const AUTH_TOKEN = 'sk_agent_toolkit_123456789';

const ToolCall = ({ toolCall, result }) => (
  <Box
    sx={{
      my: 0.5,
      fontSize: '0.875rem',
      borderLeft: '2px solid',
      borderColor: result ? 'success.main' : 'warning.main',
      pl: 1,
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
      <BuildIcon sx={{ fontSize: '0.9rem' }} />
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {typeof toolCall === 'string' ? toolCall : toolCall.name || 'Tool Call'}
      </Typography>
    </Box>
    <Box sx={{ pl: 2 }}>
      <Typography
        variant="caption"
        sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}
      >
        {typeof toolCall === 'string'
          ? ''
          : JSON.stringify(toolCall.parameters || {}, null, 2)}
      </Typography>
      {result && (
        <Typography
          variant="caption"
          sx={{
            color: 'text.primary',
            display: 'block',
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            p: 0.5,
            borderRadius: 1,
          }}
        >
          {typeof result === 'string'
            ? result
            : JSON.stringify(result, null, 2)}
        </Typography>
      )}
    </Box>
  </Box>
);

const ToolCallGroup = ({ toolCalls }) => {
  const [expanded, setExpanded] = useState(false);
  const completedCalls = toolCalls.filter((tool) => tool.result).length;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <Paper
        variant="outlined"
        sx={{
          mb: expanded ? 1 : 0,
          backgroundColor: 'transparent',
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden',
          display: 'inline-flex',
          '&:hover': {
            borderColor: 'primary.main',
          },
        }}
      >
        <Box
          onClick={() => setExpanded((prev) => !prev)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            py: 0.25,
            px: 1,
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.02)',
            },
          }}
        >
          <BuildIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Tool Calls ({completedCalls}/{toolCalls.length})
          </Typography>
          <Chip
            label={completedCalls === toolCalls.length ? 'Complete' : 'Running'}
            size="small"
            variant="outlined"
            color={completedCalls === toolCalls.length ? 'success' : 'warning'}
            sx={{
              height: '18px',
              ml: 0.5,
              '& .MuiChip-label': {
                px: 1,
                fontSize: '0.65rem',
              },
            }}
          />
          <IconButton
            size="small"
            sx={{
              p: 0.25,
              ml: -0.5,
              transform: expanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
            }}
          >
            <ExpandMoreIcon sx={{ fontSize: '0.9rem' }} />
          </IconButton>
        </Box>
      </Paper>
      {expanded && (
        <Paper
          variant="outlined"
          sx={{
            width: '85%',
            borderColor: 'divider',
            backgroundColor: 'rgba(0, 0, 0, 0.01)',
          }}
        >
          <Box sx={{ p: 1 }}>
            {toolCalls.map((tool, idx) => (
              <ToolCall key={idx} toolCall={tool.call} result={tool.result} />
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

const Chat = () => {
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const [currentThreadId, setCurrentThreadId] = useState(
    localStorage.getItem('threadId') || '847c6285-8fc9-4560-a83f-4e628578',
  );
  const [selectedModel, setSelectedModel] = useState('ollama');

  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('threadId', currentThreadId);
  }, [currentThreadId]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const clearChat = () => {
    setMessages([]);
    const newThreadId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    setCurrentThreadId(newThreadId);
  };

  const handleStream = async () => {
    if (!input.trim()) return;

    setIsStreaming(true);
    setError(null);
    const newMessage = {
      type: 'user',
      content: input,
      timestamp: new Date().toISOString(),
      status: 'sent',
    };
    setMessages((prev) => [...prev, newMessage]);
    setInput('');

    try {
      const response = await fetch('http://localhost:8081/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
        body: JSON.stringify({
          message: input,
          model: selectedModel,
          thread_id: currentThreadId,
          agent_config: {
            spicy_level: 0.8,
          },
          stream_tokens: true,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized: Invalid authentication token');
        }
        if (response.status === 405) {
          throw new Error('Method not allowed. Please check server configuration.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Streaming is not supported in this environment.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const aiMessage = {
        type: 'ai',
        content: '',
        timestamp: new Date().toISOString(),
        status: 'typing',
        toolCalls: [],
      };
      setMessages((prev) => [...prev, aiMessage]);

      let streamComplete = false;

      while (!streamComplete) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((line) => line.trim());

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          const data = line.slice(6).trim();

          if (data === '[DONE]') {
            aiMessage.status = 'sent';
            setMessages((prev) => [...prev.slice(0, -1), { ...aiMessage }]);
            streamComplete = true;
            break;
          }

          try {
            const jsonData = JSON.parse(data);
            if (jsonData.type === 'token') {
              aiMessage.content += jsonData.content;
              setMessages((prev) => [...prev.slice(0, -1), { ...aiMessage }]);
            } else if (jsonData.type === 'message' && jsonData.content?.type === 'tool') {
              const toolContent = JSON.parse(jsonData.content.content);
              aiMessage.toolCalls.push({
                call: jsonData.content.tool_calls,
                result: toolContent,
              });
              setMessages((prev) => [...prev.slice(0, -1), { ...aiMessage }]);
            }
          } catch (parseError) {
            console.warn('Failed to parse message:', data);
          }
        }
      }

      if (!streamComplete) {
        aiMessage.status = 'sent';
        setMessages((prev) => [...prev.slice(0, -1), { ...aiMessage }]);
      }
    } catch (fetchError) {
      console.error('Error:', fetchError);
      setError(fetchError.message);
      setMessages((prev) => {
        if (!prev.length) {
          return prev;
        }
        const updated = [...prev];
        const lastMessage = updated[updated.length - 1];
        if (lastMessage?.type === 'ai') {
          updated.pop();
        } else if (lastMessage?.type === 'user') {
          updated[updated.length - 1] = { ...lastMessage, status: 'error' };
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleStream();
    }
  };

  const handleRetry = (messageContent) => {
    if (isStreaming) return;

    setInput(messageContent);
    setTimeout(() => {
      handleStream();
    });
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ height: '70vh', display: 'flex', flexDirection: 'column', p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Chat Assistant</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="model-select-label">Model</InputLabel>
              <Select
                labelId="model-select-label"
                id="model-select"
                value={selectedModel}
                label="Model"
                onChange={(event) => setSelectedModel(event.target.value)}
              >
                <MenuItem value="groq-llama-3.1-8b">Llama 3.1 (8B)</MenuItem>
                <MenuItem value="mistral:latest">Mistral (Latest)</MenuItem>
                <MenuItem value="llama3.2">Llama 3.2</MenuItem>
                <MenuItem value="ollama">ollama llama3.2</MenuItem>
              </Select>
            </FormControl>
            <Tooltip title="Clear chat history">
              <IconButton onClick={clearChat} color="primary">
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
          {messages.map((message, index) => (
            <Box
              key={`${message.timestamp}-${index}`}
              sx={{
                display: 'flex',
                flexDirection: message.type === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                mb: 2,
                gap: 1,
              }}
            >
              <Avatar
                sx={{
                  bgcolor: message.type === 'user' ? 'primary.main' : 'secondary.main',
                  width: 32,
                  height: 32,
                }}
              >
                {message.type === 'user' ? <PersonIcon /> : <SmartToyIcon />}
              </Avatar>
              <Box sx={{ maxWidth: '70%', width: '100%', position: 'relative' }}>
                {message.type === 'ai' && message.toolCalls?.length > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <ToolCallGroup toolCalls={message.toolCalls} />
                  </Box>
                )}
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    backgroundColor: message.type === 'user' ? '#e3f2fd' : '#f5f5f5',
                    borderRadius: 2,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  <Typography>{message.content}</Typography>
                </Paper>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: message.type === 'user' ? 'space-between' : 'flex-start',
                    alignItems: 'center',
                    mt: 0.5,
                  }}
                >
                  {message.type === 'user' && (
                    <IconButton
                      size="small"
                      color="primary"
                      disabled={isStreaming}
                      onClick={() => handleRetry(message.content)}
                      sx={{
                        p: 0.5,
                        mr: 1,
                        opacity: 0.7,
                        '&:hover': { opacity: 1 },
                      }}
                    >
                      <ReplayIcon sx={{ fontSize: '0.9rem' }} />
                    </IconButton>
                  )}
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      textAlign: message.type === 'user' ? 'right' : 'left',
                      color: 'text.secondary',
                      flexGrow: 1,
                    }}
                  >
                    {formatTimestamp(message.timestamp)}
                    {message.status === 'typing' && ' • typing...'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type your message..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            multiline
            maxRows={4}
          />
          <Button
            variant="contained"
            color="primary"
            endIcon={isStreaming ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
            onClick={handleStream}
            disabled={isStreaming || !input.trim()}
          >
            Send
          </Button>
        </Box>
      </Paper>
      <Snackbar
        open={Boolean(error)}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Chat;
