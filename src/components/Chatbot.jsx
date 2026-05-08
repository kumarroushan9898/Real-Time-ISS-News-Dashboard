import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, Trash2 } from 'lucide-react';
import { OpenAI } from 'openai';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! Ask me about the ISS or the latest news from the dashboard!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Scroll to latest message on every update
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const apiKey = import.meta.env.VITE_AI_TOKEN;
      if (!apiKey || apiKey === 'your_huggingface_KEY') {
        throw new Error("Missing Hugging Face Token. Please add VITE_AI_TOKEN to .env");
      }

      const client = new OpenAI({
        baseURL: "https://router.huggingface.co/v1",
        apiKey: apiKey,
        dangerouslyAllowBrowser: true 
      });

      // Prepare context from dashboard
      const dashboardContext = `
        You are an AI assistant for a dashboard. YOU MUST ONLY ANSWER USING THE DASHBOARD DATA. 
        If asked about anything else, say "I can only answer questions based on the dashboard data."
        
        Recent News categories available: general, science, technology. 
        (Assume the user can see top news in these categories).
        
        The ISS (International Space Station) is currently being tracked on the map. 
        Its speed, coordinates, and nearby locations are updating live every 15 seconds.
        You can inform them that there are people currently in space.
      `;

      const apiMessages = [
        { role: 'system', content: dashboardContext },
        ...newMessages.slice(-5) // Send last 5 messages for context
      ];

      // Using Llama-3.2-1B-Instruct as requested by the user
      const chatCompletion = await client.chat.completions.create({
        model: "meta-llama/Llama-3.2-1B-Instruct:novita",
        messages: apiMessages,
        max_tokens: 150,
      });

      const responseText = chatCompletion.choices[0].message.content;
      setMessages([...newMessages, { role: 'assistant', content: responseText }]);
    } catch (err) {
      console.error(err);
      let errorMsg = 'Failed to connect to AI.';
      if (err.message.includes('Missing')) errorMsg = err.message;
      setMessages([...newMessages, { role: 'assistant', content: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: 'Hello! Ask me about the ISS or the latest news from the dashboard!' }]);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl text-white transition-transform transform hover:scale-105 z-50 ${isOpen ? 'hidden' : 'flex'} bg-gradient-to-r from-blue-500 to-purple-600`}
      >
        <MessageCircle size={28} />
      </button>

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 dark:border-gray-700 overflow-hidden" style={{ height: '500px' }}>
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center space-x-2">
              <MessageCircle size={20} />
              <h3 className="font-bold">Dashboard AI</h3>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={clearChat} title="Clear Chat" className="hover:bg-white/20 p-1 rounded transition">
                <Trash2 size={16} />
              </button>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded transition">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-500 text-white rounded-tr-none' 
                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-600 shadow-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-700 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about ISS or News..."
              className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 text-sm"
              disabled={loading}
            />
            <button 
              type="submit" 
              disabled={loading || !input.trim()}
              className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
