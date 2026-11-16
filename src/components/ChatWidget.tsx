import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Loader2,
  MessageCircle,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { askAssistant } from '../api/assistant';
import { getApiErrorMessage } from '../api/client';
import { EASE_SOFT } from '../lib/motion';
import type { AssistantTurn } from '../types';

const welcomeMessage =
  "Hi! I'm the Class Eye assistant. I can explain what Class Eye does, or help with room occupancy, capacity risk, empty rooms, floor summaries, and short-term forecasts.";

const suggestions = [
  'What is Class Eye?',
  'Which rooms need attention?',
  'Which rooms are empty?',
  'Show occupancy by floor',
  'What is the forecast for Room 203?',
];

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  model?: string | null;
  degraded?: boolean;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
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

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  function resetConversation() {
    conversationRef.current += 1;
    sendingRef.current = false;
    setMessages([{ id: 0, role: 'assistant', content: welcomeMessage }]);
    setQuestion('');
    setError(null);
    setLoading(false);
    nextId.current = 1;
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
    setMessages((current) => [...current, userMessage]);
    setQuestion('');
    setError(null);
    setLoading(true);

    try {
      const response = await askAssistant(trimmed, history);

      if (conversation !== conversationRef.current) {
        return;
      }

      const assistantId = nextId.current++;

      setMessages((current) => [
        ...current,
        {
          id: assistantId,
          role: 'assistant',
          content: response.answer,
          provider: response.provider,
          model: response.model,
          degraded: response.degraded,
        },
      ]);
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
            className="glass-strong fixed bottom-24 right-4 z-50 flex h-[min(32rem,calc(100vh-8rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden shadow-[0_24px_70px_-24px_rgba(11,111,107,0.55)] sm:right-6"
          >
            <header className="flex items-start justify-between gap-3 border-b border-white/60 bg-brand-light/60 px-4 py-3">
              <div className="flex items-start gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/80 text-brand-dark">
                  <Sparkles size={18} aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-ink">Ask Class Eye</h2>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    Class Eye help · advisory only
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={resetConversation}
                  aria-label="Start a new chat"
                  className="icon-btn h-8 w-8"
                >
                  <RotateCcw size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close assistant"
                  className="icon-btn h-8 w-8"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
            </header>

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
                        ? 'rounded-br-md bg-brand text-white'
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
                      className="rounded-full bg-brand-surface px-3 py-1.5 text-left text-xs font-medium text-ink-muted transition-[background-color,color,transform,box-shadow] duration-200 ease-soft hover:-translate-y-0.5 hover:bg-brand-light hover:text-brand-dark hover:shadow-sm active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
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
                    Checking the rooms…
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
                placeholder="Ask about rooms, risk, or forecasts…"
                className="field min-w-0 flex-1 py-2"
              />
              <button
                type="submit"
                disabled={loading || question.trim().length < 3}
                aria-label="Send question"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-sm transition-[background-color,box-shadow,transform] duration-200 ease-soft hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
              >
                <Send size={17} aria-hidden="true" />
              </button>
            </form>
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
