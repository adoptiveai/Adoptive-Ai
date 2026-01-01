export type MessageType = 'human' | 'ai' | 'tool' | 'custom' | 'system';

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  type?: string;
}

export interface ChatMessage {
  type: MessageType;
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  run_id?: string;
  response_metadata?: Record<string, unknown>;
  custom_data?: Record<string, unknown>;
  attached_files?: string[];
}

export interface ChatHistory {
  thread_id?: string;
  messages: ChatMessage[];
}

export interface UserInput {
  message: string;
  model?: string;
  thread_id?: string;
  agent_config?: Record<string, unknown>;
  file_ids?: string[] | null;
  user_id?: string;
  skip_document_injection?: boolean;
}

export interface StreamInput extends UserInput {
  stream_tokens?: boolean;
}

export interface AgentInfo {
  key: string;
  description: string;
}

export interface ServiceMetadata {
  agents: AgentInfo[];
  models: string[];
  default_agent: string;
  default_model: string;
}

export interface Feedback {
  run_id: string;
  key: string;
  score: number;
  conversation_id?: string;
  commented_message_text?: string | null;
  kwargs?: Record<string, unknown>;
}

export interface AnnotationItem {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
}

export interface AnnotationsResponse {
  annotations: AnnotationItem[];
}

export interface DocumentSourceInfo {
  path?: string | null;
  url?: string | null;
}

export interface DocumentSourceResponse {
  source_info?: DocumentSourceInfo | null;
  error?: string | null;
}

export interface Conversation {
  thread_id: string;
  title: string;
  created_at?: string;
  updated_at?: string;
}

export interface ConversationListResponse {
  conversations: Conversation[];
}

export interface FileUploadResponse {
  file_id: string;
  filename: string;
  storage_path?: string;
}

export interface GraphData {
  data: unknown;
  layout?: Record<string, unknown>;
  config?: Record<string, unknown>;
}

export interface TaskData {
  name?: string | null;
  run_id: string;
  state?: 'new' | 'running' | 'complete' | null;
  result?: 'success' | 'error' | null;
  data?: Record<string, unknown>;
}

export interface UserFeedbackPayload {
  user_id: string;
  feedback_content: string;
}

export interface UserFeedbackRead extends UserFeedbackPayload {
  id: string;
  created_at: string;
}

export interface FeedbackResponse {
  status: 'success';
}

export interface StreamChunk<T = unknown> {
  type: 'token' | 'message' | 'error' | 'raw';
  content?: T;
  additional_data?: unknown;
}

export interface ParsedStreamChunk {
  type: 'content' | 'final_content' | 'tool_calls' | 'tool_results' | 'final_message' | 'raw';
  data: unknown;
}

export interface UploadedFile {
  id: string;
  filename: string;
  created_at?: string;
  file_size?: number;
  content_type?: string;
}

export interface UserUsageStats {
  username: string;
  total_messages: number;
  estimated_tokens: number;
  estimated_cost: number;
  conversation_count: number;
}

export interface UsageStatsResponse {
  total_guest_users: number;
  total_tokens: number;
  total_messages: number;
  total_cost: number;
  user_stats: UserUsageStats[];
}

