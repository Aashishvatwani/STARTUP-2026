'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageReveal } from '@/components/UI/PageReveal';
import { Button } from '@/components/UI/Button';
import Link from 'next/link';

// Types
type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
};

export default function AssignmentChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I am your Assignment Context Assistant. I have full access to the project documentation, requirements, and codebase. What do you need help with?",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI processing with variable delay for realism
    setTimeout(() => {
      const responses = [
        "Based on the project requirements, you should prioritize the responsive layout for the dashboard first.",
        "I've checked the API documentation. The endpoint you are looking for is `/api/v1/transactions`.",
        "That feature is marked as 'Nice to Have' in the brief, so focus on the core functionality first.",
        "Here is a snippet that might help with the Web3 integration: `const provider = new ethers.providers.Web3Provider(window.ethereum);`",
        "The client specified a preference for a dark mode theme. Make sure your Tailwind config supports `darkMode: 'class'`."
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      const newAiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: randomResponse,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newAiMessage]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  };

  return (
    <PageReveal className="h-screen">
      <div className="h-full w-full bg-black-primary relative overflow-hidden flex flex-col">
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-20 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.05, 0.15, 0.05],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px]"
          />
        </div>

        {/* Header */}
        <header className="flex-none p-4 border-b border-white/10 bg-black-secondary/50 backdrop-blur-md z-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/solver/reciever-projects">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white group">
                <span className="group-hover:-translate-x-1 transition-transform inline-block">←</span> Back to Projects
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-black rounded-full animate-pulse"></span>
              </div>
              <div>
                <h1 className="text-white font-bold text-sm tracking-wide">Assignment Assistant</h1>
                <div className="text-xs text-blue-400 font-medium">Context Aware AI</div>
              </div>
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar relative z-10">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[85%] md:max-w-[70%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* Avatar */}
                  <div className="flex-shrink-0 mt-1">
                    {msg.sender === 'ai' ? (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-yellow-600 flex items-center justify-center shadow-lg text-black font-bold text-xs">
                        ME
                      </div>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`p-4 rounded-2xl backdrop-blur-sm border shadow-xl ${
                    msg.sender === 'user' 
                      ? 'bg-gold/10 border-gold/20 text-white rounded-tr-none' 
                      : 'bg-blue-500/10 border-blue-500/20 text-gray-100 rounded-tl-none'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    <div className="mt-2 text-[10px] opacity-40 text-right font-mono">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex justify-start gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg">
                   <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                   </svg>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1.5 items-center h-12">
                  <motion.span 
                    animate={{ y: [0, -5, 0] }} 
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                  />
                  <motion.span 
                    animate={{ y: [0, -5, 0] }} 
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                  />
                  <motion.span 
                    animate={{ y: [0, -5, 0] }} 
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex-none p-4 md:p-6 bg-black-secondary border-t border-white/10 relative z-20">
          <form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur opacity-20 pointer-events-none"></div>
            
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about requirements, code snippets, or design specs..."
              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder-gray-500"
            />
            
            <Button 
              type="submit" 
              disabled={!inputValue.trim() || isTyping}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold px-8 rounded-xl hover:shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTyping ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </Button>
          </form>
          <div className="text-center mt-2">
             <p className="text-[10px] text-gray-600">AI can make mistakes. Please verify critical project details.</p>
          </div>
        </div>

      </div>
    </PageReveal>
  );
}
