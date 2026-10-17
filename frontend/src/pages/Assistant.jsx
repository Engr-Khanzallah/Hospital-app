import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FaRobot, FaPaperPlane, FaUser, FaExclamationTriangle, FaRedo, FaTrashAlt,
  FaInfoCircle, FaUserMd, FaAmbulance
} from 'react-icons/fa';
import API, { getErrorMessage } from '../utils/api';

const MAX_LENGTH = 2000;
const HISTORY_TURNS = 6; // previous messages sent along so follow-up questions make sense

const SUGGESTIONS = [
  'Which doctor should I see for frequent headaches?',
  'What specialties are available at MediCare?',
  'How do I book an appointment?',
  'What can I do to sleep better?'
];

// Everything the assistant says is rendered as TEXT (React escapes it); we never inject HTML.
const Message = ({ message }) => {
  const isUser = message.role === 'user';
  const isSafety = Boolean(message.safety);

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-primary-600 text-white' : isSafety ? 'bg-red-100 text-red-600' : 'bg-primary-100 text-primary-600'
      }`}>
        {isUser ? <FaUser size={14} /> : isSafety ? <FaAmbulance size={15} /> : <FaRobot size={16} />}
      </div>
      <div className={`max-w-[85%] sm:max-w-[75%] ${isUser ? 'items-end' : ''}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? 'bg-gradient-to-r from-primary-600 to-blue-600 text-white rounded-tr-md'
            : isSafety
              ? 'bg-red-50 text-red-800 border border-red-200 rounded-tl-md'
              : 'bg-white text-gray-700 border border-gray-100 shadow-sm rounded-tl-md'
        }`}>
          {message.content}
        </div>
        {message.redacted && (
          <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
            <FaInfoCircle size={10} /> Email addresses or long numbers were removed before this was sent to the AI.
          </p>
        )}
      </div>
    </div>
  );
};

const Assistant = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [lastText, setLastText] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const pendingRef = useRef(false); // blocks double submits even before React re-renders
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, pending, error]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const send = useCallback(async (rawText, { isRetry = false } = {}) => {
    const text = rawText.trim();
    if (!text || pendingRef.current || cooldown > 0) return;
    if (text.length > MAX_LENGTH) {
      setError(`Please keep your message under ${MAX_LENGTH} characters.`);
      return;
    }

    pendingRef.current = true;
    setPending(true);
    setError('');
    setLastText(text);

    // History = what was said so far (without errors); on retry the failed message is not repeated.
    const history = messages
      .slice(-HISTORY_TURNS)
      .map((m) => ({ role: m.role, content: m.content }));

    if (!isRetry) {
      setMessages((prev) => [...prev, { id: Date.now(), role: 'user', content: text }]);
      setInput('');
    }

    try {
      const { data } = await API.post('/ai/chat', { message: text, history });
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'assistant', content: data.reply, safety: data.safety, redacted: data.redacted }
      ]);
    } catch (err) {
      setError(getErrorMessage(err, 'The assistant could not answer right now.'));
      if (err.response?.status === 429) setCooldown(Math.min(err.response.data?.retryAfterSeconds || 20, 90));
    } finally {
      pendingRef.current = false;
      setPending(false);
      inputRef.current?.focus();
    }
  }, [messages, cooldown]);

  const handleSubmit = (e) => {
    e.preventDefault();
    send(input);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const clearChat = () => {
    if (pendingRef.current) return;
    setMessages([]);
    setError('');
    setLastText('');
    setInput('');
  };

  const canSend = input.trim().length > 0 && !pending && cooldown === 0;
  const lastMessageWasUser = messages[messages.length - 1]?.role === 'user';

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold font-display text-gray-900 flex items-center gap-3">
            <span className="w-11 h-11 bg-gradient-to-br from-primary-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
              <FaRobot className="text-white text-xl" />
            </span>
            MediCare Assistant
          </h1>
          <p className="text-gray-500 mt-2">Ask general health questions or get help finding the right doctor.</p>
        </div>

        {/* Medical disclaimer - always visible */}
        <div role="note" className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 flex gap-3">
          <FaExclamationTriangle className="flex-shrink-0 mt-0.5 text-amber-500" />
          <div className="space-y-1">
            <p>
              <strong>Not medical advice.</strong> This AI assistant shares general information only. It cannot diagnose,
              prescribe medicine, or book appointments, and it can make mistakes. Always consult a qualified doctor.
            </p>
            <p>
              <strong>In an emergency</strong> (for example chest pain, trouble breathing, heavy bleeding, or thoughts of
              self-harm) call your local emergency number or go to the nearest emergency department immediately.
            </p>
            <p className="text-amber-800/80">
              Please do not enter personal details such as your full name, phone number, ID numbers, or medical records.
            </p>
          </div>
        </div>

        <div className="card overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <p className="text-sm text-gray-500">Each answer is generated by AI</p>
            <button onClick={clearChat} disabled={messages.length === 0 || pending}
              className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:hover:text-gray-400">
              <FaTrashAlt size={11} /> Clear chat
            </button>
          </div>

          {/* Messages */}
          <div className="px-4 sm:px-5 py-5 space-y-5 overflow-y-auto min-h-[320px] max-h-[55vh]"
            role="log" aria-live="polite" aria-label="Conversation with the MediCare assistant">
            {messages.length === 0 && !pending ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FaUserMd className="text-primary-400 text-2xl" />
                </div>
                <h2 className="font-semibold text-gray-700 mb-1">How can I help you today?</h2>
                <p className="text-sm text-gray-400 mb-6">Try one of these, or type your own question below.</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => send(s)} disabled={pending || cooldown > 0}
                      className="px-4 py-2 rounded-full text-sm bg-white border border-gray-200 text-gray-600 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-600 transition-all disabled:opacity-50">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => <Message key={m.id} message={m} />)
            )}

            {pending && (
              <div className="flex gap-3" aria-label="The assistant is typing">
                <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
                  <FaRobot size={16} />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-white border border-gray-100 shadow-sm flex items-center gap-1.5">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="w-2 h-2 rounded-full bg-primary-300 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex flex-col sm:flex-row sm:items-center gap-3">
                <p className="flex-1">{error}</p>
                {lastMessageWasUser && lastText && (
                  <button onClick={() => send(lastText, { isRetry: true })} disabled={pending || cooldown > 0}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors">
                    <FaRedo size={11} /> {cooldown > 0 ? `Try again in ${cooldown}s` : 'Try again'}
                  </button>
                )}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          <form onSubmit={handleSubmit} className="border-t border-gray-100 p-4 bg-white">
            <label htmlFor="assistant-input" className="sr-only">Your message</label>
            <div className="flex gap-3 items-end">
              <textarea
                id="assistant-input"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, MAX_LENGTH))}
                onKeyDown={handleKeyDown}
                rows={2}
                maxLength={MAX_LENGTH}
                placeholder="Ask a general health question..."
                className="input-field resize-none flex-1"
                disabled={pending}
              />
              <button type="submit" disabled={!canSend}
                className="btn-primary h-12 px-5 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message">
                <FaPaperPlane size={14} />
                <span className="hidden sm:inline">{pending ? 'Sending...' : cooldown > 0 ? `${cooldown}s` : 'Send'}</span>
              </button>
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>Enter to send, Shift+Enter for a new line</span>
              <span className={input.length > MAX_LENGTH - 100 ? 'text-amber-600' : ''}>{input.length}/{MAX_LENGTH}</span>
            </div>
          </form>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Ready to see a doctor? <Link to="/doctors" className="text-primary-600 font-medium hover:underline">Browse our doctors</Link>
        </p>
      </div>
    </div>
  );
};

export default Assistant;
