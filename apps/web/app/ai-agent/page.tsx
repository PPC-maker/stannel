'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
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
    <div className="min-h-screen bg-[#0f2620] -mt-16">
      {/* Hero Background */}
      <div className="absolute inset-x-0 top-0 h-[30vh]">
        <Image
          src="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1920&q=80"
          alt="AI Agent"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f2620]/30 via-transparent to-[#0f2620]" />
      </div>

      <div className="relative z-10 px-4 sm:px-6 pt-24 sm:pt-28 pb-6 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Bot size={28} className="text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">
              הסוכן שלך כאן
            </h1>
          </div>
          <p className="text-white/60">
            ברוכים הבאים לעוזר החכם של המערכת. כאן תוכלו לשאול שאלות, לקבל הדרכה והמלצות על השימוש באתר.
          </p>
        </motion.div>

        {/* Chat Container */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col h-[60vh] min-h-[400px]">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Sparkles size={48} className="text-emerald-400/50 mb-4" />
                <p className="text-white/70 text-lg mb-2">שלום! איך אוכל לעזור לך היום?</p>
                <p className="text-white/50 text-sm">בחר שאלה מוצעת או כתוב שאלה משלך</p>
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
                          ? 'bg-emerald-500/30'
                          : 'bg-emerald-500/20'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User size={16} className="text-emerald-300" />
                      ) : (
                        <Bot size={16} className="text-emerald-400" />
                      )}
                    </div>
                    <div
                      className={`max-w-[80%] rounded-xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-emerald-500/30 text-white'
                          : 'bg-white/10 text-white/80'
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
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Bot size={16} className="text-emerald-400" />
                </div>
                <div className="bg-white/10 rounded-xl px-4 py-3">
                  <Loader2 size={20} className="text-emerald-400 animate-spin" />
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts */}
          {messages.length === 0 && suggestedPrompts.length > 0 && (
            <div className="px-4 pb-4">
              <p className="text-white/50 text-xs mb-2">שאלות מוצעות:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.slice(0, 6).map((prompt: any) => (
                  <button
                    key={prompt.id}
                    onClick={() => handleSend(prompt.text)}
                    disabled={isPending}
                    className="text-sm px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/70 hover:bg-white/20 hover:text-white hover:border-emerald-500/30 transition-all disabled:opacity-50"
                  >
                    {prompt.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-white/10">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="שאל אותי משהו..."
                disabled={isPending}
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all disabled:opacity-50"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isPending}
                className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
