import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ChevronLeft,
  Clock,
  History,
  Loader2,
  MessageCircle,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { askAssistant } from '../api/assistant';
import { getApiErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { EASE_SOFT } from '../lib/motion';
import type { AssistantTurn } from '../types';

const welcomeMessage =
  "Hi! I'm the Class Eye assistant. I can help with room occupancy, capacity alerts, schedules, and explain system features.";

const suggestions = [
  'Which rooms need attention?',
  'Which rooms are empty?',
  'What time is OOP-JAVA?',
  'What day is DATASTRUCT?',
  'Show occupancy by floor',
];

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  model?: string | null;
  degraded?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

function formatSessionTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Storage key is scoped to the logged-in user for confidentiality
  const storageKey = `class_eye_chat_sessions_${user?.staff_id ?? user?.id ?? 'default'}`;

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? (JSON.parse(stored) as ChatSession[]) : [];
    } catch {
      return [];
    }
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(
    () => `session_${Date.now()}`
  );

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 0, role: 'assistant', content: welcomeMessage },
  ]);

  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextId = useRef(1);
  const sendingRef = useRef(false);
  const conversationRef = useRef(0);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Reload sessions if user switches
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      const parsed = stored ? (JSON.parse(stored) as ChatSession[]) : [];
      setSessions(parsed);
      setCurrentSessionId(`session_${Date.now()}`);
      setMessages([{ id: 0, role: 'assistant', content: welcomeMessage }]);
    } catch {
      setSessions([]);
    }
  }, [storageKey]);

  // Persist sessions to localStorage
  const persistSessions = useCallback(
    (newSessions: ChatSession[]) => {
      setSessions(newSessions);
      try {
        localStorage.setItem(storageKey, JSON.stringify(newSessions));
      } catch {
        // quota exceeded or private mode
      }
    },
    [storageKey]
  );

  // Save or update active session
  const saveCurrentSession = useCallback(
    (newMessages: ChatMessage[]) => {
      const userTurns = newMessages.filter((m) => m.role === 'user');
      if (userTurns.length === 0) return;

      const firstQuestion = userTurns[0]?.content ?? 'New Chat';
      const title =
        firstQuestion.length > 34 ? `${firstQuestion.slice(0, 34).trim()}…` : firstQuestion;

      setSessions((prev) => {
        const existingIndex = prev.findIndex((s) => s.id === currentSessionId);
        const updatedSession: ChatSession = {
          id: currentSessionId,
          title: existingIndex >= 0 ? prev[existingIndex].title : title,
          createdAt: existingIndex >= 0 ? prev[existingIndex].createdAt : Date.now(),
          updatedAt: Date.now(),
          messages: newMessages,
        };

        const updated =
          existingIndex >= 0
            ? prev.map((s, idx) => (idx === existingIndex ? updatedSession : s))
            : [updatedSession, ...prev];

        try {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    },
    [currentSessionId, storageKey]
  );

  useEffect(() => {
    if (open && !showHistory) {
      inputRef.current?.focus();
    }
  }, [open, showHistory]);

  useEffect(() => {
    if (!open || showHistory) {
      return;
    }
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, open, showHistory]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (showHistory) {
          setShowHistory(false);
        } else {
          setOpen(false);
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, showHistory]);

  function startNewChat() {
    conversationRef.current += 1;
    sendingRef.current = false;
    setCurrentSessionId(`session_${Date.now()}`);
    setMessages([{ id: 0, role: 'assistant', content: welcomeMessage }]);
    setQuestion('');
    setError(null);
    setLoading(false);
    setShowHistory(false);
    nextId.current = 1;
  }

  function loadSession(session: ChatSession) {
    conversationRef.current += 1;
    sendingRef.current = false;
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setQuestion('');
    setError(null);
    setLoading(false);
    setShowHistory(false);
    nextId.current = session.messages.length + 1;
  }

  function deleteSession(sessionId: string, e: React.MouseEvent) {
    e.stopPropagation();
    const updated = sessions.filter((s) => s.id !== sessionId);
    persistSessions(updated);
    if (currentSessionId === sessionId) {
      startNewChat();
    }
  }

  function clearAllHistory() {
    persistSessions([]);
    startNewChat();
  }

  async function send(value: string) {
    const trimmed = value.trim();

    if (trimmed.length < 3) {
      setError('Please ask a question with at least 3 characters.');
      return;
    }

    if (sendingRef.current) {
      return;
    }

    const history: AssistantTurn[] = messages
      .filter((message) => message.id !== 0)
      .slice(-6)
      .map(({ role, content }) => ({ role, content }));

    const userId = nextId.current++;
    const userMessage: ChatMessage = { id: userId, role: 'user', content: trimmed };
    const conversation = conversationRef.current;

    sendingRef.current = true;
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    saveCurrentSession(nextMessages);

    setQuestion('');
    setError(null);
    setLoading(true);

    try {
      const response = await askAssistant(trimmed, history);

      if (conversation !== conversationRef.current) {
        return;
      }

      const assistantId = nextId.current++;
      const finalMessages: ChatMessage[] = [
        ...nextMessages,
        {
          id: assistantId,
          role: 'assistant',
          content: response.answer,
          provider: response.provider,
          model: response.model,
          degraded: response.degraded,
        },
      ];

      setMessages(finalMessages);
      saveCurrentSession(finalMessages);
    } catch (requestError) {
      if (conversation === conversationRef.current) {
        setError(getApiErrorMessage(requestError, 'The assistant is unavailable right now.'));
      }
    } finally {
      if (conversation === conversationRef.current) {
        sendingRef.current = false;
        setLoading(false);
      }
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(question);
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.section
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: EASE_SOFT }}
            role="dialog"
            aria-label="Class Eye assistant"
            id="class-eye-chat"
            className="glass-strong fixed bottom-24 right-4 z-50 flex h-[min(34rem,calc(100vh-8rem))] w-[min(25rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl shadow-[0_24px_70px_-24px_rgba(11,111,107,0.55)] sm:right-6"
          >
            {/* Header */}
            <header className="flex items-center justify-between border-b border-white/60 bg-brand-light/60 px-4 py-3">
              {showHistory ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowHistory(false)}
                    aria-label="Back to chat"
                    className="icon-btn h-8 w-8 text-ink hover:text-brand-dark"
                  >
                    <ChevronLeft size={18} aria-hidden="true" />
                  </button>
                  <div>
                    <h2 className="text-sm font-bold text-ink">Chat History</h2>
                    <p className="text-[11px] text-ink-muted">Claude-style saved conversations</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/80 text-brand-dark shadow-xs">
                    <Sparkles size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-ink">Ask Class Eye</h2>
                    <p className="text-xs text-ink-muted">AI advisory · role-aware</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1">
                {/* History button */}
                <button
                  type="button"
                  onClick={() => setShowHistory((curr) => !curr)}
                  aria-label={showHistory ? 'Return to conversation' : 'View chat history'}
                  title="Chat history"
                  className={`icon-btn relative h-8 w-8 transition-colors ${
                    showHistory
                      ? 'bg-brand text-white hover:bg-brand-dark'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  <History size={16} aria-hidden="true" />
                  {!showHistory && sessions.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                      {sessions.length > 9 ? '9+' : sessions.length}
                    </span>
                  )}
                </button>

                {/* New Chat button */}
                <button
                  type="button"
                  onClick={startNewChat}
                  aria-label="Start a new chat"
                  title="Start a new chat"
                  className="icon-btn h-8 w-8 text-ink-muted hover:text-brand-dark"
                >
                  <Plus size={17} aria-hidden="true" />
                </button>

                {/* Close Widget */}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close assistant"
                  className="icon-btn h-8 w-8 text-ink-muted hover:text-ink"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
            </header>

            {/* Main content: Either Chat History list OR Conversation */}
            {showHistory ? (
              <div className="flex flex-1 flex-col overflow-hidden bg-brand-surface/40">
                <div className="flex items-center justify-between border-b border-brand-light/60 px-4 py-2.5 text-xs text-ink-muted">
                  <span className="font-semibold uppercase tracking-wider text-[10px] text-ink/70">
                    Past Conversations ({sessions.length})
                  </span>
                  <button
                    type="button"
                    onClick={startNewChat}
                    className="inline-flex items-center gap-1 font-semibold text-brand hover:text-brand-dark"
                  >
                    <Plus size={13} />
                    New Chat
                  </button>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto p-3">
                  {sessions.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center px-6 text-center text-ink-muted">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-light/70 text-brand-dark">
                        <MessageSquare size={20} />
                      </div>
                      <p className="mt-3 text-xs font-semibold text-ink">No conversations yet</p>
                      <p className="mt-1 text-[11px] text-ink-muted">
                        Ask any question about rooms, capacity, or schedules to build your history.
                      </p>
                    </div>
                  ) : (
                    sessions.map((s) => {
                      const isActive = s.id === currentSessionId;
                      const msgCount = s.messages.filter((m) => m.role === 'user').length;

                      return (
                        <div
                          key={s.id}
                          onClick={() => loadSession(s)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') loadSession(s);
                          }}
                          className={`group relative flex cursor-pointer items-start justify-between gap-3 rounded-xl border p-3 text-left transition-all ${
                            isActive
                              ? 'border-brand/40 bg-brand/10 shadow-xs'
                              : 'border-white/60 bg-white/70 hover:border-brand/30 hover:bg-white'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <MessageSquare
                                size={13}
                                className={isActive ? 'text-brand' : 'text-ink-muted'}
                              />
                              <p className="truncate text-xs font-semibold text-ink">
                                {s.title}
                              </p>
                            </div>
                            <div className="mt-1.5 flex items-center gap-3 text-[11px] text-ink-muted">
                              <span className="inline-flex items-center gap-1">
                                <Clock size={11} />
                                {formatSessionTime(s.updatedAt)}
                              </span>
                              <span>·</span>
                              <span>
                                {msgCount} {msgCount === 1 ? 'question' : 'questions'}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => deleteSession(s.id, e)}
                            aria-label={`Delete chat: ${s.title}`}
                            title="Delete this chat"
                            className="rounded-lg p-1 text-ink-muted opacity-60 transition-all hover:bg-danger-light hover:text-danger group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {sessions.length > 0 && (
                  <div className="border-t border-brand-light/60 p-2 text-center">
                    <button
                      type="button"
                      onClick={clearAllHistory}
                      className="text-[11px] font-medium text-danger/80 hover:text-danger"
                    >
                      Clear all chat history
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div
                  ref={listRef}
                  className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
                  aria-live="polite"
                >
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                          message.role === 'user'
                            ? 'rounded-br-md bg-brand text-white shadow-xs'
                            : 'rounded-bl-md bg-brand-surface text-ink'
                        }`}
                      >
                        <p className="whitespace-pre-line">{message.content}</p>
                        {message.role === 'assistant' && (message.provider || message.degraded) && (
                          <p className="mt-1.5 text-[11px] text-ink-muted">
                            {message.provider === 'heuristic'
                              ? 'Local analysis'
                              : `${message.provider}${message.model ? ` (${message.model})` : ''}`}
                            {message.degraded ? ' · fallback used' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  {messages.length === 1 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => void send(suggestion)}
                          disabled={loading}
                          className="rounded-full bg-brand-surface px-3 py-1.5 text-left text-xs font-medium text-ink-muted transition-[background-color,color,transform,box-shadow] duration-200 ease-soft hover:-translate-y-0.5 hover:bg-brand-light hover:text-brand-dark hover:shadow-xs active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}

                  {loading && (
                    <div className="flex justify-start">
                      <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md bg-brand-surface px-3.5 py-2.5 text-sm text-ink-muted">
                        <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                        Checking data…
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <p
                    role="alert"
                    className="mx-4 mb-2 flex items-start gap-2 rounded-lg bg-danger-light px-3 py-2 text-xs text-danger"
                  >
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                    {error}
                  </p>
                )}

                <form
                  onSubmit={handleSubmit}
                  className="flex items-center gap-2 border-t border-brand-light px-3 py-3"
                >
                  <label htmlFor="assistant-chat-input" className="sr-only">
                    Question
                  </label>
                  <input
                    id="assistant-chat-input"
                    ref={inputRef}
                    type="text"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    maxLength={500}
                    placeholder="Ask about rooms, alerts, or schedules…"
                    className="field min-w-0 flex-1 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={loading || question.trim().length < 3}
                    aria-label="Send question"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-xs transition-[background-color,box-shadow,transform] duration-200 ease-soft hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-sm active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    <Send size={17} aria-hidden="true" />
                  </button>
                </form>
              </>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? 'Close Class Eye assistant' : 'Open Class Eye assistant'}
        aria-expanded={open}
        aria-controls="class-eye-chat"
        className="fixed bottom-5 right-4 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-[0_12px_32px_rgba(11,111,107,0.35)] transition-[transform,background-color,box-shadow] duration-200 ease-soft hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-[0_18px_44px_-12px_rgba(11,111,107,0.65)] hover:ring-4 hover:ring-brand/15 active:translate-y-0 active:scale-95 sm:right-6"
      >
        {open ? (
          <X size={22} aria-hidden="true" />
        ) : (
          <MessageCircle size={24} aria-hidden="true" />
        )}
      </button>
    </>
  );
}
