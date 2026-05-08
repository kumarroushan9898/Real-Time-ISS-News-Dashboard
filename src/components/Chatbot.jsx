import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, Trash2 } from 'lucide-react';
import { OpenAI } from 'openai';

const WELCOME = 'Hello! I can answer questions about the ISS location, speed, and the latest news shown on this dashboard. Ask me anything!';
const STORAGE_KEY = 'chat_history_v2';
const MAX_STORED = 30;

export default function Chatbot({ issPosition, issSpeed, issPlace, trackedPoints, newsArticles }) {
  const [isOpen, setIsOpen] = useState(false);

  // Start fresh on reload; session messages stored to localStorage during session
  const [messages, setMessages] = useState([{ role: 'assistant', content: WELCOME }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Persist last 30 messages to localStorage during session (but don't restore on reload)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED)));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildContext = () => {
    // Build a rich system prompt with real dashboard data
    const issInfo = issPosition
      ? `Current ISS Data:
- Latitude: ${issPosition.lat.toFixed(4)}°
- Longitude: ${issPosition.lng.toFixed(4)}°
- Speed: ${issSpeed.toFixed(0)} km/h
- Nearest Location: ${issPlace}
- Tracked positions: ${trackedPoints}`
      : 'ISS data is still loading...';

    const newsInfo = newsArticles && newsArticles.length > 0
      ? `Latest News Headlines on Dashboard (${newsArticles.length} articles total):
${newsArticles.slice(0, 10).map((a, i) =>
  `${i + 1}. [${a.category?.toUpperCase()}] "${a.title}" - Source: ${a.source}, Date: ${new Date(a.date).toLocaleDateString()}`
).join('\n')}`
      : 'News data is still loading...';

    return `You are a smart assistant for the AstroDash dashboard. You MUST ONLY answer questions based on the dashboard data provided below. Do NOT use any outside knowledge, do NOT guess, do NOT make up data. If asked about something not in the data, say "I can only answer based on the dashboard data."

=== DASHBOARD DATA ===

${issInfo}

${newsInfo}

=== END DASHBOARD DATA ===

Answer concisely and accurately using only the data above.`;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const apiKey = import.meta.env.VITE_AI_TOKEN;
      if (!apiKey || apiKey === 'your_huggingface_KEY') {
        throw new Error('Missing VITE_AI_TOKEN in .env');
      }

      const client = new OpenAI({
        baseURL: 'https://router.huggingface.co/v1',
        apiKey,
        dangerouslyAllowBrowser: true,
      });

      const chatCompletion = await client.chat.completions.create({
        model: 'meta-llama/Llama-3.2-1B-Instruct:novita',
        messages: [
          { role: 'system', content: buildContext() },
          // Send last 6 turns for memory, skip the welcome message
          ...updated.slice(1).slice(-6),
        ],
        max_tokens: 200,
      });

      const reply = chatCompletion.choices[0]?.message?.content?.trim() || 'No response.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: err.message.includes('Missing') ? err.message : '⚠️ AI unavailable right now. Please check your VITE_AI_TOKEN.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: WELCOME }]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 p-4 rounded-full shadow-2xl text-white z-50 flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 hover:scale-110 transition-transform"
          aria-label="Open AI Chat"
        >
          <MessageCircle size={28} />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 dark:border-gray-700 overflow-hidden"
          style={{ height: '520px' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 flex justify-between items-center text-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <MessageCircle size={20} />
              <div>
                <p className="font-bold text-sm leading-none">Dashboard AI</p>
                <p className="text-[10px] text-white/70 leading-none mt-0.5">Llama 3.2 · ISS + News context</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={clearChat} title="Clear Chat" className="hover:bg-white/20 p-1.5 rounded-lg transition">
                <Trash2 size={15} />
              </button>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded-lg transition">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed
                  ${msg.role === 'user'
                    ? 'bg-blue-500 text-white rounded-tr-none'
                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-600 shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-700 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 dark:border-gray-600 flex gap-1 items-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex gap-2 flex-shrink-0">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about ISS or news..."
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm outline-none focus:border-blue-500 transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 transition"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
