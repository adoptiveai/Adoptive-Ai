'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AnnotationItem, ChatMessage, Conversation, UploadedFile } from '@/types/api';

export interface PdfDialogState {
  open: boolean;
  documentName?: string;
  annotations?: AnnotationItem[];
  debug?: boolean;
  blockIndices?: number[];
  keywords?: string[];
}

interface ChatState {
  messages: ChatMessage[];
  currentThreadId: string | null;
  conversationTitle: string;
  conversations: Conversation[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  selectedFiles: File[];
  attachedFiles: UploadedFile[];
  suggestedCommand?: string;
  pdfDialog?: PdfDialogState | null;
  selectedModel: string;
}

interface ChatActions {
  setThreadId: (threadId: string) => void;
  setConversationTitle: (title: string) => void;
  setConversations: (conversations: Conversation[]) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  updateLastMessage: (content: string) => void;
  replaceLastMessage: (message: ChatMessage) => void;
  moveLastAiMessageToEnd: () => void;
  setLoading: (isLoading: boolean) => void;
  setStreaming: (isStreaming: boolean) => void;
  setError: (error: string | null) => void;
  addFile: (file: File) => void;
  removeFile: (name: string) => void;
  clearFiles: () => void;
  attachFile: (file: UploadedFile) => void;
  detachFile: (fileId: string) => void;
  setSuggestedCommand: (command?: string) => void;
  setPdfDialog: (dialog: PdfDialogState | null) => void;
  setSelectedModel: (model: string) => void;
  reset: (threadId?: string) => void;
}

type ChatStore = ChatState & ChatActions;

const DEFAULT_TITLE = 'New Conversation';

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      messages: [],
      currentThreadId: null,
      conversationTitle: DEFAULT_TITLE,
      conversations: [],
      isLoading: false,
      isStreaming: false,
      error: null,
      selectedFiles: [],
      attachedFiles: [],
      suggestedCommand: undefined,
      pdfDialog: null,
      selectedModel: 'gpt-4.1',

      setThreadId: (threadId: string) => set({ currentThreadId: threadId }),
      setConversationTitle: (title: string) => set({ conversationTitle: title || DEFAULT_TITLE }),
      setConversations: (conversations: Conversation[]) => set({ conversations }),
      setMessages: (messages: ChatMessage[]) => set({ messages }),
      addMessage: (message: ChatMessage) => set({ messages: [...get().messages, message] }),
      updateLastMessage: (content: string) => {
        const messages = get().messages.slice();
        for (let i = messages.length - 1; i >= 0; i -= 1) {
          if (messages[i].type === 'ai') {
            messages[i] = {
              ...messages[i],
              content,
            };
            break;
          }
        }
        set({ messages });
      },
      replaceLastMessage: (message: ChatMessage) => {
        const messages = get().messages.slice();
        for (let i = messages.length - 1; i >= 0; i -= 1) {
          if (messages[i].type === 'ai') {
            messages[i] = message;
            set({ messages });
            return;
          }
        }
        set({ messages: [...messages, message] });
      },
      moveLastAiMessageToEnd: () => {
        const messages = get().messages.slice();
        for (let i = messages.length - 1; i >= 0; i -= 1) {
          if (messages[i].type === 'ai') {
            const [aiMessage] = messages.splice(i, 1);
            messages.push(aiMessage);
            set({ messages });
            return;
          }
        }
      },
      setLoading: (isLoading: boolean) => set({ isLoading }),
      setStreaming: (isStreaming: boolean) => set({ isStreaming }),
      setError: (error: string | null) => set({ error }),
      addFile: (file: File) => set({ selectedFiles: [...get().selectedFiles, file] }),
      removeFile: (name: string) =>
        set({ selectedFiles: get().selectedFiles.filter((file) => file.name !== name) }),
      clearFiles: () => set({ selectedFiles: [], attachedFiles: [] }),
      attachFile: (file: UploadedFile) => {
        const current = get().attachedFiles;
        if (!current.find((f) => f.id === file.id)) {
          set({ attachedFiles: [...current, file] });
        }
      },
      detachFile: (fileId: string) =>
        set({ attachedFiles: get().attachedFiles.filter((f) => f.id !== fileId) }),
      setSuggestedCommand: (command?: string) => set({ suggestedCommand: command }),
      setPdfDialog: (dialog: PdfDialogState | null) => set({ pdfDialog: dialog }),
      setSelectedModel: (model: string) => set({ selectedModel: model }),
      reset: (threadId?: string) =>
        set({
          messages: [],
          currentThreadId: threadId ?? crypto.randomUUID(),
          conversationTitle: DEFAULT_TITLE,
          selectedFiles: [],
          attachedFiles: [],
          error: null,
          suggestedCommand: undefined,
        }),
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({ currentThreadId: state.currentThreadId, conversationTitle: state.conversationTitle, selectedModel: state.selectedModel }),
    }
  )
);
