'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageReveal } from '@/components/UI/PageReveal';
import { Button } from '@/components/UI/Button';
import Link from 'next/link';

// Types
type MessageType = 'text' | 'proposal';

type Message = {
  id: string;
  type: MessageType;
  text?: string;
  price?: number;
  sender: 'user' | 'client'; // 'user' is the Solver
  timestamp: Date;
  status?: 'pending' | 'accepted' | 'rejected'; // For proposals
};

export default function SolverNegotiationPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'text',
      text: "Hello! I reviewed your profile and I'd like to hire you for my project.",
      sender: 'client',
      timestamp: new Date(Date.now() - 1000 * 60 * 10)
    },
    {
      id: '2',
      type: 'text',
      text: "The budget is around $500. Are you available?",
      sender: 'client',
      timestamp: new Date(Date.now() - 1000 * 60 * 9)
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceInput, setPriceInput] = useState('');
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [locationShared, setLocationShared] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'text',
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    
    // Simulate Client reply
    simulateClientReply();
  };

  const handleSendProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceInput.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'proposal',
      price: parseFloat(priceInput),
      sender: 'user',
      timestamp: new Date(),
      status: 'pending'
    };

    setMessages(prev => [...prev, newMessage]);
    setShowPriceModal(false);
    setPriceInput('');

    // Simulate Client response to proposal
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        // Randomly accept or reject for demo purposes
        const accept = Math.random() > 0.5;
        
        if (accept) {
           setMessages(prev => prev.map(msg => 
             msg.id === newMessage.id ? { ...msg, status: 'accepted' } : msg
           ));
           
           const reply: Message = {
             id: (Date.now() + 1).toString(),
             type: 'text',
             text: "That looks fair. I accept your offer!",
             sender: 'client',
             timestamp: new Date()
           };
           setMessages(prev => [...prev, reply]);
        } else {
           setMessages(prev => prev.map(msg => 
             msg.id === newMessage.id ? { ...msg, status: 'rejected' } : msg
           ));

           const reply: Message = {
             id: (Date.now() + 1).toString(),
             type: 'text',
             text: "That's a bit higher than my budget. Can you come down a bit?",
             sender: 'client',
             timestamp: new Date()
           };
           setMessages(prev => [...prev, reply]);
        }
      }, 2000);
    }, 500);
  };

  const simulateClientReply = () => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        type: 'text',
        text: "Okay, let me know what you think about the requirements.",
        sender: 'client',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, reply]);
    }, 2000);
  };

  const handleProposalAction = (messageId: string, action: 'accept' | 'reject') => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return { ...msg, status: action === 'accept' ? 'accepted' : 'rejected' };
      }
      return msg;
    }));
  };

  // Share user's current geolocation and notify backend
  const handleConfirmBrief = async () => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      alert('Geolocation not available in this browser');
      return;
    }
    setIsSharingLocation(true);
    try {
      const getPos = () => new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 })
      );
      const pos = await getPos();
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

      const res = await fetch(`${backend}/api/users/${userId || 'unknown'}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lon })
      });
      if (!res.ok) {
        throw new Error(`server returned ${res.status}`);
      }

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'text',
        text: 'Location shared (lat: ' + lat.toFixed(5) + ', lon: ' + lon.toFixed(5) + ')',
        sender: 'user',
        timestamp: new Date()
      }]);
      setLocationShared(true);
    } catch (err: any) {
      console.error('Failed to share location', err);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'text',
        text: 'Location sharing failed: ' + (err?.message || String(err)),
        sender: 'user',
        timestamp: new Date()
      }]);
      alert('Could not share location: ' + (err?.message || String(err)));
    } finally {
      setIsSharingLocation(false);
    }
  };

  return (
    <PageReveal className="h-screen">
      <div className="h-full w-full bg-black-primary relative overflow-hidden flex flex-col">
        
        {/* Header */}
        <header className="flex-none p-4 border-b border-white/10 bg-black-secondary/50 backdrop-blur-md z-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/solver/dashboard">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                ← Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                JD
              </div>
              <div>
                <h1 className="text-white font-bold text-sm">John Doe (Client)</h1>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-xs text-gray-400">Online</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="border-white/10 text-gray-300 hover:text-white"
                onClick={() => handleConfirmBrief()}
                disabled={isSharingLocation}
              >
                {isSharingLocation ? 'Sharing...' : 'Confirm Brief'}
              </Button>
              <Button variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/10">End Chat</Button>
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar relative z-10">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] md:max-w-[60%] ${msg.type === 'proposal' ? 'w-full md:w-[400px]' : ''}`}>
                
                {/* Text Message */}
                {msg.type === 'text' && (
                  <div className={`p-4 rounded-2xl backdrop-blur-sm border ${
                    msg.sender === 'user' 
                      ? 'bg-gold/10 border-gold/20 text-white rounded-tr-none' 
                      : 'bg-white/5 border-white/10 text-gray-200 rounded-tl-none'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    <div className="mt-1 text-[10px] opacity-50 text-right">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )}

                {/* Proposal Card */}
                {msg.type === 'proposal' && (
                  <div className={`p-5 rounded-xl border-2 ${
                    msg.status === 'pending' ? 'border-gold bg-black/80 shadow-[0_0_30px_rgba(212,175,55,0.15)]' :
                    msg.status === 'accepted' ? 'border-green-500 bg-green-900/20' :
                    'border-red-500 bg-red-900/20'
                  }`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Price Proposal</div>
                        <div className="text-3xl font-bold text-white font-mono">${msg.price}</div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        msg.status === 'pending' ? 'bg-gold text-black animate-pulse' :
                        msg.status === 'accepted' ? 'bg-green-500 text-black' :
                        'bg-red-500 text-white'
                      }`}>
                        {msg.status}
                      </div>
                    </div>

                    {/* If Client sent the proposal, Solver can Accept/Reject */}
                    {msg.status === 'pending' && msg.sender !== 'user' && (
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <Button 
                          onClick={() => handleProposalAction(msg.id, 'reject')}
                          className="bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20"
                        >
                          Reject
                        </Button>
                        <Button 
                          onClick={() => handleProposalAction(msg.id, 'accept')}
                          className="bg-green-500 text-black hover:bg-green-400 font-bold"
                        >
                          Accept
                        </Button>
                      </div>
                    )}

                    {/* If Solver sent the proposal, show waiting status */}
                    {msg.status === 'pending' && msg.sender === 'user' && (
                      <div className="text-xs text-gray-500 italic text-center mt-2">
                        Waiting for client response...
                      </div>
                    )}
                    
                    {msg.status === 'accepted' && (
                       <div className="text-center text-green-400 text-sm font-medium mt-2">
                         Offer Accepted
                       </div>
                    )}
                    
                    {msg.status === 'rejected' && (
                       <div className="text-center text-red-400 text-sm font-medium mt-2">
                         Offer Rejected
                       </div>
                    )}
                  </div>
                )}

              </div>
            </motion.div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
               <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl rounded-tl-none flex gap-2 items-center">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex-none p-4 bg-black-secondary border-t border-white/10 relative z-20">
          <form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto">
            <Button 
              type="button"
              onClick={() => setShowPriceModal(true)}
              className="bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20 px-4"
            >
              ₹ Negotiate
            </Button>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 text-white focus:outline-none focus:border-gold/50 transition-colors"
            />
            <Button 
              type="submit" 
              disabled={!inputValue.trim()}
              className="bg-gold-gradient text-black font-bold px-6 rounded-xl"
            >
              Send
            </Button>
          </form>
        </div>

        {/* Price Negotiation Modal */}
        <AnimatePresence>
          {showPriceModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-[#1a1a1a] border border-gold/30 p-6 rounded-2xl w-full max-w-sm shadow-[0_0_50px_rgba(0,0,0,0.8)]"
              >
                <h3 className="text-xl font-bold text-white mb-2">Propose a Price</h3>
                <p className="text-gray-400 text-sm mb-6">Enter the amount you want to offer for this project.</p>
                
                <form onSubmit={handleSendProposal}>
                  <div className="relative mb-6">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold font-mono text-xl">$</span>
                    <input
                      type="number"
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-black border border-white/10 rounded-xl py-4 pl-10 pr-4 text-2xl text-white font-mono focus:outline-none focus:border-gold transition-colors"
                      autoFocus
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="flex-1 text-gray-400 hover:text-white"
                      onClick={() => setShowPriceModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 bg-gold-gradient text-black font-bold"
                      disabled={!priceInput}
                    >
                      Send Offer
                    </Button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </PageReveal>
  );
}
