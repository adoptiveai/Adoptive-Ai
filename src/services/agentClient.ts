import axios, { AxiosInstance } from 'axios';
import { getEnv } from '@/lib/env';
import type {
  AgentInfo,
  AnnotationsResponse,
  ChatHistory,
  ChatMessage,
  ConversationListResponse,
  DocumentSourceResponse,
  Feedback,
  FileUploadResponse,
  ParsedStreamChunk,
  ServiceMetadata,
  StreamInput,
  UserFeedbackPayload,
  UserFeedbackRead,
  UserInput,
  UploadedFile,
  UsageStatsResponse,
} from '@/types/api';

const env = getEnv();

export class AgentClientError extends Error { }

export class AgentClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private authToken?: string;

  constructor(baseUrl: string = env.NEXT_PUBLIC_AGENT_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 60_000,
    });

    this.client.interceptors.request.use((config) => {
      if (this.authToken) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${this.authToken}`,
        } as any;
      }
      return config;
    });
  }

  setAuthToken(token?: string) {
    this.authToken = token;
  }

  clearAuthToken() {
    this.authToken = undefined;
  }

  async getServiceInfo(): Promise<ServiceMetadata> {
    try {
      const { data } = await this.client.get<ServiceMetadata>('/info');
      return data;
    } catch (error) {
      throw this.wrapError(error, 'Failed to load service info');
    }
  }

  async getAgents(): Promise<AgentInfo[]> {
    const info = await this.getServiceInfo();
    return info.agents;
  }

  async getHistory(threadId: string, userId?: string): Promise<ChatHistory> {
    try {
      const payload = {
        thread_id: threadId,
        user_id: userId,
      };
      const { data } = await this.client.post<ChatHistory>('/history', payload);
      return data;
    } catch (error) {
      throw this.wrapError(error, 'Failed to load chat history');
    }
  }

  async invoke(input: UserInput, agentId?: string): Promise<ChatMessage> {
    try {
      const endpoint = agentId ? `/${agentId}/invoke` : '/invoke';
      const { data } = await this.client.post<ChatMessage>(endpoint, input);
      return data;
    } catch (error) {
      throw this.wrapError(error, 'Failed to invoke agent');
    }
  }

  async stream(input: StreamInput, agentId?: string): Promise<ReadableStream<Uint8Array>> {
    const endpoint = agentId ? `/${agentId}/stream` : '/stream';
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}),
      },
      body: JSON.stringify(input),
    });

    if (!response.body) {
      throw new AgentClientError('Streaming response body missing');
    }
    return response.body;
  }

  async *parseStream(stream: ReadableStream<Uint8Array>): AsyncGenerator<ParsedStreamChunk, void, unknown> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (!data || data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'token' && parsed.content) {
              yield { type: 'content', data: parsed.content };
              continue;
            }
            if (parsed.type === 'message' && parsed.content) {
              const message = parsed.content as ChatMessage;
              if (message.type === 'ai') {
                if (message.tool_calls?.length) {
                  yield { type: 'tool_calls', data: message.tool_calls };
                }
                if (message.content) {
                  if (message.response_metadata?.finish_reason) {
                    yield { type: 'final_content', data: message.content };
                    yield { type: 'final_message', data: message };
                  } else {
                    yield { type: 'content', data: message.content };
                  }
                }
              } else if (message.type === 'tool' && message.tool_call_id) {
                yield {
                  type: 'tool_results',
                  data: [
                    {
                      tool_call_id: message.tool_call_id,
                      content: message.content,
                    },
                  ],
                };
              } else if (message.content) {
                yield { type: 'content', data: message.content };
              }
              continue;
            }
            if (parsed.type === 'tool' && parsed.tool_call_id) {
              yield {
                type: 'tool_results',
                data: [
                  {
                    tool_call_id: parsed.tool_call_id,
                    content: parsed.content,
                  },
                ],
              };
              continue;
            }
            if (parsed.tool_calls) {
              yield { type: 'tool_calls', data: parsed.tool_calls };
              continue;
            }
            if (parsed.tool_results) {
              yield { type: 'tool_results', data: parsed.tool_results };
              continue;
            }
            if (parsed.content) {
              yield { type: 'content', data: parsed.content };
              continue;
            }
            yield { type: 'raw', data: parsed };
          } catch (parseError) {
            console.error('Stream parse error', parseError);
            yield { type: 'raw', data };
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (buffer.trim()) {
      yield { type: 'content', data: buffer.trim() };
    }
  }

  async uploadFile(file: File, params: { threadId?: string; userId: string; agentId?: string }): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const queryParams = new URLSearchParams();
    if (params.threadId) {
      queryParams.append('thread_id', params.threadId);
    }
    if (params.userId) {
      queryParams.append('user_id', params.userId);
    }
    if (params.agentId) {
      queryParams.append('agent_id', params.agentId);
    }

    try {
      const json = await fetch(`${this.baseUrl}/upload?${queryParams.toString()}`, {
        method: 'POST',
        body: formData,
        headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : undefined,
      }).then(async (res) => {
        if (!res.ok) {
          const message = await res.text();
          throw new AgentClientError(message || 'File upload failed');
        }
        return res.json();
      });

      return json as FileUploadResponse;
    } catch (error) {
      throw this.wrapError(error, 'File upload failed');
    }
  }

  async getConversations(userId: string, limit = 100): Promise<ConversationListResponse> {
    try {
      const { data } = await this.client.get<ConversationListResponse>('/conversations', {
        params: { user_id: userId, limit },
      });
      return data;
    } catch (error) {
      throw this.wrapError(error, 'Failed to load conversations');
    }
  }

  async setConversationTitle(threadId: string, title: string, userId: string): Promise<void> {
    try {
      await this.client.post(`/conversations/${threadId}/title`, null, {
        params: { title, user_id: userId },
      });
    } catch (error) {
      throw this.wrapError(error, 'Failed to set conversation title');
    }
  }

  async getConversationTitle(threadId: string, userId: string): Promise<string> {
    try {
      const { data } = await this.client.get<{ thread_id: string; title: string }>(
        `/conversations/${threadId}/title`,
        { params: { user_id: userId } }
      );
      return data.title;
    } catch (error) {
      throw this.wrapError(error, 'Failed to fetch conversation title');
    }
  }

  async deleteConversation(threadId: string, userId: string): Promise<void> {
    try {
      await this.client.delete(`/conversations/${threadId}`, {
        params: { user_id: userId },
      });
    } catch (error) {
      throw this.wrapError(error, 'Failed to delete conversation');
    }
  }

  async createFeedback(feedback: Feedback): Promise<void> {
    try {
      await this.client.post('/feedback', feedback);
    } catch (error) {
      throw this.wrapError(error, 'Failed to submit feedback');
    }
  }

  async getDocumentSourceStatus(documentName: string): Promise<DocumentSourceResponse> {
    try {
      const { data } = await this.client.get<DocumentSourceResponse>(
        `/documents/${encodeURIComponent(documentName)}/source_status`
      );
      return data;
    } catch (error) {
      throw this.wrapError(error, 'Failed to resolve document source');
    }
  }

  async getAnnotations(payload: {
    pdf_file: string;
    block_indices: number[];
    keywords?: string[];
    user_id?: string;
  }): Promise<AnnotationsResponse> {
    try {
      const { data } = await this.client.post<AnnotationsResponse>('/rag/annotations', payload);
      return data;
    } catch (error) {
      throw this.wrapError(error, 'Failed to fetch PDF annotations');
    }
  }

  async debugPdfBlocks(payload: { pdf_file: string; user_id?: string }): Promise<AnnotationsResponse> {
    try {
      const { data } = await this.client.post<AnnotationsResponse>('/rag/debug_blocks', payload);
      return data;
    } catch (error) {
      throw this.wrapError(error, 'Failed to fetch PDF debug blocks');
    }
  }

  async getPdf(documentName: string): Promise<Blob> {
    try {
      // The /rag/pdf_content endpoint requires the token as a query parameter
      const response = await this.client.get(`/rag/pdf_content/${encodeURIComponent(documentName)}`, {
        responseType: 'blob',
        params: this.authToken ? { token: this.authToken } : undefined,
      });
      return response.data;
    } catch (error) {
      throw this.wrapError(error, 'Failed to fetch PDF content');
    }
  }

  async getGraph(graphId: string): Promise<unknown> {
    try {
      const { data } = await this.client.get(`/graph/${graphId}`);
      return data;
    } catch (error) {
      throw this.wrapError(error, 'Failed to fetch graph data');
    }
  }

  async submitUserFeedback(payload: UserFeedbackPayload): Promise<UserFeedbackRead> {
    try {
      const { data } = await this.client.post<UserFeedbackRead>('/user_feedback', payload);
      return data;
    } catch (error) {
      throw this.wrapError(error, 'Failed to submit user feedback');
    }
  }

  async getFiles(userId: string, limit = 100): Promise<UploadedFile[]> {
    try {
      const { data } = await this.client.get<{ files: UploadedFile[] }>('/files', {
        params: { user_id: userId, limit },
      });
      return data.files;
    } catch (error) {
      throw this.wrapError(error, 'Failed to load files');
    }
  }

  async attachFile(threadId: string, fileId: string, userId: string): Promise<void> {
    try {
      await this.client.post(`/conversations/${threadId}/files/${fileId}`, null, {
        params: { user_id: userId },
      });
    } catch (error) {
      throw this.wrapError(error, 'Failed to attach file');
    }
  }

  async getUsageStats(usernames: string[], users_info?: { username: string, user_id: string }[]): Promise<UsageStatsResponse> {
    try {
      const { data } = await this.client.post<UsageStatsResponse>('/admin/usage-stats', {
        usernames: usernames,
        users_info: users_info || []
      });
      return data;
    } catch (error) {
      throw this.wrapError(error, 'Failed to fetch usage stats');
    }
  }

  async getUserTokenUsage(userId: string): Promise<{ total_tokens: number; input_tokens: number; output_tokens: number; total_cost: number }> {
    try {
      const { data } = await this.client.get<{ total_tokens: number; input_tokens: number; output_tokens: number; total_cost: number }>(
        `/user/${userId}/token-usage`
      );
      return data;
    } catch (error) {
      // Return zeros if endpoint not available or error
      console.warn('Failed to fetch user token usage:', error);
      return { total_tokens: 0, input_tokens: 0, output_tokens: 0, total_cost: 0 };
    }
  }

  private wrapError(error: unknown, fallbackMessage: string) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.detail || error.response?.data?.message || error.message || fallbackMessage;
      return new AgentClientError(message);
    }
    if (error instanceof Error) {
      return new AgentClientError(error.message);
    }
    return new AgentClientError(fallbackMessage);
  }
}

export const agentClient = new AgentClient();
