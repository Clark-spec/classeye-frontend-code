import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Bot,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  Clock,
  Copy,
  HelpCircle,
  History,
  Layers,
  LayoutGrid,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { askAssistant } from '../api/assistant';
import { getApiErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { AssistantTurn } from '../types';

// ─── Spring animation presets ───────────────────────────────────────────────
const SPRING_PANEL = { type: 'spring', stiffness: 350, damping: 28 } as const;
const SPRING_MSG   = { type: 'spring', stiffness: 400, damping: 30 } as const;

// ─── Constants ──────────────────────────────────────────────────────────────
const welcomeMessage =
  "Hi! I'm the Class Eye Assistant. I can assist with room occupancy, capacity alerts, schedules, and system navigation.";

const quickSuggestions = [
  'Which rooms need attention?',
  'What classes are today?',
  'What time is OOP-JAVA?',
  'Which rooms are empty?',
  'Show occupancy by floor',
];

const categorizedSuggestions = [
  {
    category: 'Schedules',
    icon: Calendar,
    items: [
      'What classes are today?',
      'What time is OOP-JAVA?',
      'Give me details of all schedules',
      'Who teaches which class?',
    ],
  },
  {
    category: 'Rooms & Occupancy',
    icon: LayoutGrid,
    items: [
      'Which rooms need attention?',
      'Which rooms are empty right now?',
      'Show occupancy by floor',
      'Which room has the highest capacity?',
    ],
  },
  {
    category: 'System & Guides',
    icon: Layers,
    items: [
      'What can you help me with?',
      'How does room capacity monitoring work?',
      'What are my access permissions?',
    ],
  },
];

// ─── Types ──────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  model?: string | null;
  degraded?: boolean;
  createdAt?: number;
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatSessionTime(timestamp: number): string {
  const diffMs   = Date.now() - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1)  return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)   return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatMessageClock(timestamp?: number): string {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Lightweight Markdown Renderer ──────────────────────────────────────────
function FormattedContent({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5 leading-relaxed">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={lineIdx} className="h-1" />;

        // Horizontal divider
        if (trimmed === '---' || trimmed === '***') {
          return <hr key={lineIdx} className="my-2 border-brand-light/50" />;
        }

        // Section header ##
        if (trimmed.startsWith('## ')) {
          return (
            <h3
              key={lineIdx}
              className="mt-2 border-b border-brand-light/40 pb-0.5 text-[13.5px] font-bold text-brand-dark"
            >
              {renderInline(trimmed.slice(3))}
            </h3>
          );
        }

        // Subheader ###
        if (trimmed.startsWith('### ')) {
          return (
            <h4
              key={lineIdx}
              className="mt-1 text-[13px] font-semibold text-ink"
            >
              {renderInline(trimmed.slice(4))}
            </h4>
          );
        }

        // Bullet point detection: -, *, •, or ▸
        const bulletMatch = /^[•*▸\-]\s+(.*)$/.exec(trimmed);
        if (bulletMatch) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-1 text-[13px]">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/70" />
              <span>{renderInline(bulletMatch[1])}</span>
            </div>
          );
        }

        // Numbered list detection: 1. , 2. , etc.
        const numberMatch = /^(\d+)\.\s+(.*)$/.exec(trimmed);
        if (numberMatch) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-1 text-[13px]">
              <span className="shrink-0 font-semibold text-brand text-[12px]">
                {numberMatch[1]}.
              </span>
              <span>{renderInline(numberMatch[2])}</span>
            </div>
          );
        }

        return (
          <p key={lineIdx} className="text-[13.5px]">
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4)
      return <strong key={idx} className="font-semibold text-ink">{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2)
      return (
        <code key={idx} className="rounded bg-brand/10 px-1 py-0.5 font-mono text-[11.5px] font-medium text-brand-dark">
          {part.slice(1, -1)}
        </code>
      );
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2)
      return <em key={idx} className="italic">{part.slice(1, -1)}</em>;
    return part;
  });
}

// ─── Copy Button for Assistant Answers ───────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore if clipboard API is restricted
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'Copied' : 'Copy answer'}
      title={copied ? 'Copied to clipboard' : 'Copy answer'}
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-ink-muted opacity-0 transition-all hover:bg-brand/10 hover:text-brand-dark group-hover:opacity-100 focus:opacity-100"
    >
      {copied ? (
        <>
          <Check size={11} className="text-emerald-600" />
          <span className="font-medium text-emerald-600">Copied</span>
        </>
      ) : (
        <>
          <Copy size={11} />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

// ─── Animated typing dots ───────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full"
          style={{
            background: 'linear-gradient(135deg, rgba(11,111,107,0.5), #0b6f6b)',
            animation: 'typingBounce 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Provider badge ──────────────────────────────────────────────────────────
function ProviderBadge({ provider }: { provider?: string }) {
  if (!provider || provider === 'heuristic') return null;
  return (
    <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-medium text-brand-dark">
      <Sparkles size={9} aria-hidden="true" />
      Class Eye AI
    </span>
  );
}

// ─── Scroll-to-bottom floating pill ─────────────────────────────────────────
function ScrollDownButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label="Scroll to latest message"
      initial={{ opacity: 0, y: 6, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.9 }}
      transition={SPRING_MSG}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg hover:bg-brand-dark active:scale-95 transition-colors"
    >
      <ChevronDown size={13} aria-hidden="true" />
      New message
    </motion.button>
  );
}

// ─── Main ChatWidget ────────────────────────────────────────────────────────
export function ChatWidget() {
  const { user } = useAuth();

  const [open, setOpen]                               = useState(false);
  const [showHistory, setShowHistory]                 = useState(false);
  const [showSuggestionsMenu, setShowSuggestionsMenu] = useState(false);
  const [showScrollDown, setShowScrollDown]           = useState(false);
  const [hasUnread, setHasUnread]                     = useState(false);
  const isAdmin = user?.role === 'admin';

  // Stop FAB pulse animation once user has opened the widget
  const [hasOpenedEver, setHasOpenedEver] = useState<boolean>(() => {
    try { return localStorage.getItem('class_eye_chat_has_opened') === 'true'; }
    catch { return false; }
  });

  // Storage key is scoped to the logged-in user for CIA confidentiality
  const storageKey = `class_eye_chat_sessions_${user?.staff_id ?? user?.id ?? 'default'}`;

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? (JSON.parse(stored) as ChatSession[]) : [];
    } catch { return []; }
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(
    () => `session_${Date.now()}`
  );

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 0, role: 'assistant', content: welcomeMessage, createdAt: Date.now() },
  ]);

  const [question, setQuestion] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const nextId          = useRef(1);
  const sendingRef      = useRef(false);
  const conversationRef = useRef(0);
  const listRef         = useRef<HTMLDivElement | null>(null);
  const inputRef        = useRef<HTMLInputElement | null>(null);

  // ── Open / close toggle ───────────────────────────────────────────────────
  const handleOpenToggle = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        setHasUnread(false);
        if (!hasOpenedEver) {
          setHasOpenedEver(true);
          try { localStorage.setItem('class_eye_chat_has_opened', 'true'); } catch { /**/ }
        }
      }
      return next;
    });
  };

  // ── Scroll detection ──────────────────────────────────────────────────────
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    function onScroll() {
      if (!el) return;
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollDown(distFromBottom > 80);
    }

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [open, showHistory]);

  function scrollToBottom(behavior: ScrollBehavior = 'smooth') {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior });
  }

  // ── User switch reloads history ───────────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      const parsed = stored ? (JSON.parse(stored) as ChatSession[]) : [];
      setSessions(parsed);
      setCurrentSessionId(`session_${Date.now()}`);
      setMessages([{ id: 0, role: 'assistant', content: welcomeMessage, createdAt: Date.now() }]);
    } catch { setSessions([]); }
  }, [storageKey]);

  // ── Persist sessions ──────────────────────────────────────────────────────
  const persistSessions = useCallback(
    (newSessions: ChatSession[]) => {
      setSessions(newSessions);
      try { localStorage.setItem(storageKey, JSON.stringify(newSessions)); } catch { /**/ }
    },
    [storageKey]
  );

  // ── Save or update active session ─────────────────────────────────────────
  const saveCurrentSession = useCallback(
    (newMessages: ChatMessage[]) => {
      const userTurns = newMessages.filter((m) => m.role === 'user');
      if (userTurns.length === 0) return;

      const firstQuestion = userTurns[0]?.content ?? 'New Chat';
      const title = firstQuestion.length > 34
        ? `${firstQuestion.slice(0, 34).trim()}…`
        : firstQuestion;

      setSessions((prev) => {
        const existingIndex = prev.findIndex((s) => s.id === currentSessionId);
        const updatedSession: ChatSession = {
          id: currentSessionId,
          title: existingIndex >= 0 ? prev[existingIndex].title : title,
          createdAt: existingIndex >= 0 ? prev[existingIndex].createdAt : Date.now(),
          updatedAt: Date.now(),
          messages: newMessages,
        };

        const updated = existingIndex >= 0
          ? prev.map((s, idx) => (idx === existingIndex ? updatedSession : s))
          : [updatedSession, ...prev];

        try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch { /**/ }
        return updated;
      });
    },
    [currentSessionId, storageKey]
  );

  // ── Focus & scroll effects ────────────────────────────────────────────────
  useEffect(() => {
    if (open && !showHistory) inputRef.current?.focus();
  }, [open, showHistory]);

  useEffect(() => {
    if (!open || showHistory) return;
    scrollToBottom();
    setShowScrollDown(false);
  }, [messages, loading, open, showHistory]);

  // ── Escape key closes ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (showHistory) setShowHistory(false);
        else setOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, showHistory]);

  // ── Session handlers ──────────────────────────────────────────────────────
  function startNewChat() {
    conversationRef.current += 1;
    sendingRef.current = false;
    setCurrentSessionId(`session_${Date.now()}`);
    setMessages([{ id: 0, role: 'assistant', content: welcomeMessage, createdAt: Date.now() }]);
    setQuestion('');
    setError(null);
    setLoading(false);
    setShowHistory(false);
    setShowSuggestionsMenu(false);
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
    setShowSuggestionsMenu(false);
    nextId.current = session.messages.length + 1;
  }

  function deleteSession(sessionId: string, e: React.MouseEvent) {
    e.stopPropagation();
    const updated = sessions.filter((s) => s.id !== sessionId);
    persistSessions(updated);
    if (currentSessionId === sessionId) startNewChat();
  }

  function clearAllHistory() {
    persistSessions([]);
    startNewChat();
  }

  // ── Send ──────────────────────────────────────────────────────────────────
  async function send(value: string) {
    const trimmed = value.trim();
    if (trimmed.length < 3) {
      setError('Please ask a question with at least 3 characters.');
      return;
    }
    if (sendingRef.current) return;

    const history: AssistantTurn[] = messages
      .filter((m) => m.id !== 0)
      .slice(-12)
      .map(({ role, content }) => ({
        role,
        content: content.length > 3500 ? `${content.slice(0, 3497)}...` : content,
      }));

    const userId = nextId.current++;
    const userMessage: ChatMessage = { id: userId, role: 'user', content: trimmed, createdAt: Date.now() };
    const conversation = conversationRef.current;

    sendingRef.current = true;
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    saveCurrentSession(nextMessages);
    setQuestion('');
    setError(null);
    setLoading(true);
    setShowSuggestionsMenu(false);

    try {
      const response = await askAssistant(trimmed, history);
      if (conversation !== conversationRef.current) return;

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
          createdAt: Date.now(),
        },
      ];
      setMessages(finalMessages);
      saveCurrentSession(finalMessages);

      // If user closed the chat while generating, show unread badge on FAB
      if (!open) {
        setHasUnread(true);
      }
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

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Keyframes ── */}
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.45; }
          30%            { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes fabPulse {
          0%, 100% { box-shadow: 0 0 0 0   rgba(11,111,107,0.45); }
          50%       { box-shadow: 0 0 0 14px rgba(11,111,107,0); }
        }
        @keyframes emptyPulse {
          0%, 100% { transform: scale(1);    opacity: 0.7; }
          50%       { transform: scale(1.08); opacity: 1; }
        }
      `}</style>

      {/* ── Chat panel ── */}
      <AnimatePresence>
        {open && (
          <motion.section
            initial={{ opacity: 0, y: 20, scale: 0.94 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: 20, scale: 0.94 }}
            transition={SPRING_PANEL}
            role="dialog"
            aria-label="Class Eye assistant"
            id="class-eye-chat"
            className="glass-strong fixed bottom-24 right-4 z-50 flex h-[min(36rem,calc(100vh-8rem))] w-[min(28rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl shadow-[0_24px_70px_-24px_rgba(11,111,107,0.6)] sm:right-6"
          >

            {/* ── Header (gradient) ── */}
            <header className="flex items-center justify-between border-b border-white/20 bg-gradient-to-r from-brand to-brand-dark/95 px-4 py-3 shadow-sm">
              {showHistory ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowHistory(false)}
                    aria-label="Back to chat"
                    className="icon-btn h-8 w-8 text-white/80 hover:text-white"
                  >
                    <ChevronLeft size={18} aria-hidden="true" />
                  </button>
                  <div>
                    <h2 className="text-sm font-bold text-white">Chat History</h2>
                    <p className="text-[11px] text-white/60">Your saved conversations</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-white/25 to-white/10 text-white shadow-xs ring-1 ring-white/25">
                    <Bot size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-sm font-bold text-white">Ask Class Eye</h2>
                      <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold text-white/95 backdrop-blur-sm">
                        {isAdmin ? 'Admin' : 'Teacher'}
                      </span>
                    </div>
                    <p className="text-xs text-white/65">
                      {isAdmin ? 'School-wide access' : 'Classroom & schedule load'}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1">
                {/* Suggestions toggle */}
                {!showHistory && (
                  <button
                    type="button"
                    onClick={() => setShowSuggestionsMenu((curr) => !curr)}
                    aria-label="Common questions"
                    title="Suggested prompts"
                    className={`icon-btn h-8 w-8 transition-colors ${
                      showSuggestionsMenu
                        ? 'bg-white/25 text-white'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    <HelpCircle size={16} aria-hidden="true" />
                  </button>
                )}

                {/* History */}
                <button
                  type="button"
                  onClick={() => { setShowHistory((c) => !c); setShowSuggestionsMenu(false); }}
                  aria-label={showHistory ? 'Return to conversation' : 'View chat history'}
                  title="Chat history"
                  className={`icon-btn relative h-8 w-8 transition-colors ${
                    showHistory
                      ? 'bg-white/25 text-white'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <History size={16} aria-hidden="true" />
                  {!showHistory && sessions.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-brand">
                      {sessions.length > 9 ? '9+' : sessions.length}
                    </span>
                  )}
                </button>

                {/* New Chat */}
                <button
                  type="button"
                  onClick={startNewChat}
                  aria-label="Start a new chat"
                  title="Start a new chat"
                  className="icon-btn h-8 w-8 text-white/70 hover:text-white"
                >
                  <Plus size={17} aria-hidden="true" />
                </button>

                {/* Close */}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close assistant"
                  className="icon-btn h-8 w-8 text-white/70 hover:text-white"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
            </header>

            {/* ── History Panel OR Chat ── */}
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
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-light/70 text-brand-dark"
                        style={{ animation: 'emptyPulse 2.4s ease-in-out infinite' }}
                      >
                        <MessageSquare size={24} />
                      </div>
                      <p className="mt-3 text-xs font-semibold text-ink">No conversations yet</p>
                      <p className="mt-1 text-[11px] text-ink-muted">
                        Ask about rooms, occupancy, or schedules to build your history.
                      </p>
                    </div>
                  ) : (
                    sessions.map((s) => {
                      const isActive  = s.id === currentSessionId;
                      const msgCount  = s.messages.filter((m) => m.role === 'user').length;
                      return (
                        <div
                          key={s.id}
                          onClick={() => loadSession(s)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === 'Enter') loadSession(s); }}
                          className={`group relative flex cursor-pointer items-start justify-between gap-3 rounded-xl border p-3 text-left transition-all hover:shadow-sm ${
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
                              <p className="truncate text-xs font-semibold text-ink">{s.title}</p>
                            </div>
                            <div className="mt-1.5 flex items-center gap-3 text-[11px] text-ink-muted">
                              <span className="inline-flex items-center gap-1">
                                <Clock size={11} />
                                {formatSessionTime(s.updatedAt)}
                              </span>
                              <span>·</span>
                              <span>{msgCount} {msgCount === 1 ? 'question' : 'questions'}</span>
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
                {/* ── Message List ── */}
                <div
                  ref={listRef}
                  className="relative flex-1 space-y-3 overflow-y-auto px-4 py-4"
                  aria-live="polite"
                >
                  <AnimatePresence initial={false}>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{
                          opacity: 0,
                          x: message.role === 'user' ? 20 : -12,
                          y: 6,
                        }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        transition={SPRING_MSG}
                        className={`group flex ${
                          message.role === 'user'
                            ? 'justify-end'
                            : 'items-end gap-2 justify-start'
                        }`}
                      >
                        {/* Bot avatar */}
                        {message.role === 'assistant' && (
                          <span className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-white shadow-sm ring-1 ring-brand/20">
                            <Bot size={14} aria-hidden="true" />
                          </span>
                        )}

                        <div
                          className={`relative max-w-[84%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                            message.role === 'user'
                              ? 'rounded-br-md bg-gradient-to-br from-[#0b9e99] to-brand-dark text-white'
                              : 'rounded-bl-md border-l-2 border-brand/30 bg-brand-surface text-ink'
                          }`}
                        >
                          <FormattedContent text={message.content} />

                          <div className="mt-1 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              {message.role === 'assistant' && (
                                <>
                                  <ProviderBadge provider={message.provider} />
                                  <CopyButton text={message.content} />
                                </>
                              )}
                            </div>

                            {message.createdAt && (
                              <span
                                className={`text-[10px] opacity-60 ${
                                  message.role === 'user'
                                    ? 'text-white/80 ml-auto'
                                    : 'text-ink-muted'
                                }`}
                              >
                                {formatMessageClock(message.createdAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Suggestion panel (Quick or Categorized) */}
                  {(messages.length === 1 || showSuggestionsMenu) && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={SPRING_MSG}
                      className="rounded-xl border border-brand/20 bg-brand-light/40 p-3"
                    >
                      {showSuggestionsMenu ? (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between border-b border-brand-light/60 pb-1.5 text-xs font-semibold text-brand-dark">
                            <span>Suggested Questions by Topic</span>
                            <button
                              type="button"
                              onClick={() => setShowSuggestionsMenu(false)}
                              className="text-ink-muted hover:text-ink text-[11px]"
                            >
                              Close
                            </button>
                          </div>
                          {categorizedSuggestions.map((group) => {
                            const IconComponent = group.icon;
                            return (
                              <div key={group.category} className="space-y-1">
                                <div className="flex items-center gap-1 text-[11px] font-semibold text-brand-dark/90">
                                  <IconComponent size={12} className="text-brand" />
                                  <span>{group.category}</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {group.items.map((suggestion) => (
                                    <button
                                      key={suggestion}
                                      type="button"
                                      onClick={() => void send(suggestion)}
                                      disabled={loading}
                                      className="rounded-full bg-white/95 px-2.5 py-1 text-left text-[11.5px] font-medium text-ink transition-all hover:bg-brand hover:text-white hover:shadow-xs active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      {suggestion}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-brand-dark">
                            <span>Suggested questions:</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {quickSuggestions.map((suggestion) => (
                              <button
                                key={suggestion}
                                type="button"
                                onClick={() => void send(suggestion)}
                                disabled={loading}
                                className="rounded-full bg-white/95 px-3 py-1.5 text-left text-xs font-medium text-ink transition-all hover:-translate-y-0.5 hover:bg-brand hover:text-white hover:shadow-xs active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* 3-dot typing indicator */}
                  <AnimatePresence>
                    {loading && (
                      <motion.div
                        initial={{ opacity: 0, x: -12, y: 4 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, x: -12, y: 4 }}
                        transition={SPRING_MSG}
                        className="flex items-end gap-2 justify-start"
                      >
                        <span className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-white shadow-sm ring-1 ring-brand/20">
                          <Bot size={14} aria-hidden="true" />
                        </span>
                        <div className="rounded-2xl rounded-bl-md border-l-2 border-brand/30 bg-brand-surface px-3.5 py-3 shadow-sm">
                          <TypingDots />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Scroll-to-bottom button */}
                  <AnimatePresence>
                    {showScrollDown && (
                      <ScrollDownButton onClick={() => scrollToBottom()} />
                    )}
                  </AnimatePresence>
                </div>

                {/* Error banner */}
                {error && (
                  <p
                    role="alert"
                    className="mx-4 mb-2 flex items-start gap-2 rounded-lg bg-danger-light px-3 py-2 text-xs text-danger"
                  >
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                    {error}
                  </p>
                )}

                {/* ── Input bar ── */}
                <form
                  onSubmit={handleSubmit}
                  className="relative flex items-center gap-2 border-t border-brand-light/60 bg-white/70 px-3 py-2.5 backdrop-blur-sm"
                >
                  <label htmlFor="assistant-chat-input" className="sr-only">
                    Question
                  </label>

                  {/* Input with focus glow */}
                  <div className="relative min-w-0 flex-1 rounded-full ring-1 ring-brand-light transition-shadow duration-200 focus-within:ring-2 focus-within:ring-brand/40 focus-within:shadow-[0_0_0_4px_rgba(11,111,107,0.08)]">
                    <input
                      id="assistant-chat-input"
                      ref={inputRef}
                      type="text"
                      value={question}
                      onChange={(event) => setQuestion(event.target.value)}
                      maxLength={500}
                      placeholder="Ask about rooms, alerts, or schedules…"
                      className="w-full rounded-full border-0 bg-transparent py-2 pl-4 pr-16 text-sm text-ink placeholder:text-ink-muted outline-none"
                    />

                    {/* Clear button when typing */}
                    {question.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setQuestion('')}
                        aria-label="Clear question"
                        title="Clear"
                        className="absolute right-10 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-ink-muted hover:bg-brand/10 hover:text-ink transition-colors"
                      >
                        <X size={13} />
                      </button>
                    )}

                    {/* Character counter */}
                    {question.length > 350 && (
                      <span
                        className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono ${
                          question.length >= 480 ? 'font-bold text-danger' : 'text-ink-muted'
                        }`}
                      >
                        {question.length}/500
                      </span>
                    )}
                  </div>

                  {/* Send / Spinner button */}
                  <button
                    type="submit"
                    disabled={loading || question.trim().length < 3}
                    aria-label="Send question"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-white shadow-sm transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {loading ? (
                      <Loader2 size={17} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <Send size={17} aria-hidden="true" />
                    )}
                  </button>
                </form>
              </>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── FAB Button with pulse and unread notification badge ── */}
      <button
        type="button"
        onClick={handleOpenToggle}
        aria-label={open ? 'Close Class Eye assistant' : 'Open Class Eye assistant'}
        aria-expanded={open}
        aria-controls="class-eye-chat"
        className="fixed bottom-5 right-4 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-white shadow-[0_12px_32px_rgba(11,111,107,0.4)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_-12px_rgba(11,111,107,0.7)] hover:ring-4 hover:ring-brand/15 active:translate-y-0 active:scale-95 sm:right-6"
        style={!open && !hasOpenedEver ? { animation: 'fabPulse 2.5s ease-in-out infinite' } : undefined}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X size={22} aria-hidden="true" />
            </motion.span>
          ) : (
            <motion.span
              key="bot"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Bot size={24} aria-hidden="true" />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Unread message ping indicator */}
        {!open && hasUnread && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-white" />
          </span>
        )}
      </button>
    </>
  );
}
