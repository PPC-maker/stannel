'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/layout/GlassCard';
import PageSlider, { sliderImages } from '@/components/layout/PageSlider';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { useAiChat, useAiPrompts } from '@/lib/api-hooks';
import { useAuthGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import type { ChatMessage } from '@stannel/types';

export default function AiAgentPage() {
  const { isReady } = useAuthGuard();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { mutate: sendMessage, isPending } = useAiChat();
  const { data: promptsData } = useAiPrompts();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  const suggestedPrompts = promptsData?.prompts || [];

  const handleSend = (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isPending) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    sendMessage(
      { message: text, conversationHistory: messages },
      {
        onSuccess: (data) => {
          const assistantMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: data.message,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        },
        onError: () => {
          const errorMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'מצטער, אירעה שגיאה. אנא נסה שוב.',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F8FAFC]">
      <PageSlider images={sliderImages.dashboard} />
      <div className="p-6 max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-400/20 to-gold-600/20 flex items-center justify-center">
              <Bot size={28} className="text-gold-400" />
            </div>
            <h1 className="text-3xl font-display font-bold text-gray-900">
              הסוכן שלך כאן
            </h1>
          </div>
          <p className="text-gray-700">
            ברוכים הבאים לעוזר החכם של המערכת. כאן תוכלו לשאול שאלות, לקבל הדרכה והמלצות על השימוש באתר.
          </p>
        </motion.div>

        {/* Chat Container */}
        <GlassCard className="flex flex-col h-[60vh] min-h-[400px]" hover={false}>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Sparkles size={48} className="text-gold-400/50 mb-4" />
                <p className="text-gray-600 text-lg mb-2">שלום! איך אוכל לעזור לך היום?</p>
                <p className="text-gray-600 text-sm">בחר שאלה מוצעת או כתוב שאלה משלך</p>
              </div>
            ) : (
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        message.role === 'user'
                          ? 'bg-primary-500/30'
                          : 'bg-gold-400/20'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User size={16} className="text-primary-300" />
                      ) : (
                        <Bot size={16} className="text-gold-400" />
                      )}
                    </div>
                    <div
                      className={`max-w-[80%] rounded-xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-primary-500/30 text-gray-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

            {isPending && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-gold-400/20 flex items-center justify-center">
                  <Bot size={16} className="text-gold-400" />
                </div>
                <div className="bg-gray-100 rounded-xl px-4 py-3">
                  <Loader2 size={20} className="text-gold-400 animate-spin" />
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts */}
          {messages.length === 0 && suggestedPrompts.length > 0 && (
            <div className="px-4 pb-4">
              <p className="text-gray-600 text-xs mb-2">שאלות מוצעות:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.slice(0, 6).map((prompt) => (
                  <button
                    key={prompt.id}
                    onClick={() => handleSend(prompt.text)}
                    disabled={isPending}
                    className="text-sm px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-200 hover:text-gray-900 hover:border-[#0066CC]/30 transition-all disabled:opacity-50"
                  >
                    {prompt.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="שאל אותי משהו..."
                disabled={isPending}
                className="flex-1 bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/50 transition-all disabled:opacity-50"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isPending}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-primary-900 hover:from-gold-300 hover:to-gold-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
