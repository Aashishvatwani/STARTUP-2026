'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageReveal } from '@/components/UI/PageReveal';
import { Button } from '@/components/UI/Button';
import axios from 'axios';
import { useRouter } from 'next/navigation';



// Types
type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
};

type Brief = {
  title: string;
  budget: string;
  deadline: string;
  skills: string[];
};

export default function ChatboxPage() {
  const router = useRouter();
  const [resp, setResp] = useState(null);

  const [userId, setUserId] = useState<string | null>(  null);
   
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello. I am your AI Project Architect. Describe what you want to build, and I will structure a perfect brief for you.",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  
  // 2. Retrieving it in your Chatbox Page
  useEffect(() => {
    // session.user from next-auth doesn't include `id` in the default type,
    // so cast to any (or extend the Session type) before accessing id.
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      // Redirect to login if missing
      router.push('/reciever/login');
    }
  }, []);
    const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [brief, setBrief] = useState<Brief>({
    title: 'Pending...',
    budget: '-',
    deadline: '-',
    skills: []
  });
  // Store normalized NLP response here and prefer it over `brief` when present
  const [nlpResult, setNlpResult] = useState<any | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    setInputValue('');
    
    // Add user message
    const newUserMsg: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMsg]);
    setIsTyping(true);

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080/api'}/nlp/parse`, {
        text: userText,
        userId: userId
      });
console.log("NLP Full Response:", response.data);
      // Normalize and structure backend NLP response
      const raw: any = response.data?.data || {};

console.log("NLP Raw Response this is :", raw.data);
      // Parse deadline if present (expects ISO like "2025-11-24T20:06:44.690403")
      let deadlineDate: string | null = null;
      let deadlineHour: string | null = null;
      if (raw.deadline) {
        try {
          const d = new Date(raw.deadline);
          if (!isNaN(d.getTime())) {
        // Date in YYYY-MM-DD
        deadlineDate = d.toISOString().split('T')[0];
        // Hour in 24h format as string (e.g. "20")
        deadlineHour = String(d.getHours()).padStart(2, '0');
          }
        } catch {
          // leave as null if parsing fails
        }
      }

      const data = {
        // canonical fields
        topic: raw.topic || raw.title || raw.type || null,
        type: raw.type || null,
        domain: raw.domain || null,
        urgency: raw.urgency || raw.priority || null,
        estimated_price: raw.estimated_price ?? raw.price ?? null,

        // normalize skills into a unique, trimmed array
        skills_required: Array.isArray(raw.skills_required)
          ? Array.from(new Set(raw.skills_required.map((s: any) => String(s).trim()).filter(Boolean))) as string[]
          : typeof raw.skills_required === 'string'
          ? Array.from(new Set(raw.skills_required.split(',').map((s: string) => s.trim()).filter(Boolean))) as string[]
          : [] as string[],

        // deadline: keep original plus normalized date + hour-only fields
        raw_deadline: raw.deadline ?? null,
        deadline: deadlineDate,      // YYYY-MM-DD or null
        deadline_hour: deadlineHour , // "HH" (24-hour) or null
        
      };



      if (response.data.success && data) {
        // store the normalized NLP result for later use (confirm/send payload)
        setNlpResult(data);
        // If NLP returned an explicit message or marked the input as irrelevant,
        // surface it directly as an AI message and set a simple brief.
        console.log("NLP Raw Response:", raw.data);
        if (raw.type === 'Irrelevant' || (raw.message && String(raw.message).trim() !== '')) {
          const jokeText = String(raw.message || 'I could not find anything relevant to parse.');

          // Update brief to reflect irrelevance
          setBrief({
            title: 'Irrelevant Input',
            budget: '-',
            deadline: 'Flexible',
            skills: []
          });

          // Push the AI joke/message into the chat
          const jokeMsg: Message = {
            id: (Date.now() + 1).toString(),
            text: jokeText,
            sender: 'ai',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, jokeMsg]);

        } else {
          // Normal NLP result: update brief and add assistant summary
          console.log("NLP Response Data:", data);
          setBrief({
            title: data.topic || data.type || 'Untitled Project',
            budget: data.estimated_price ? `₹${data.estimated_price}` : 'Negotiable',
            deadline: data.deadline || 'Flexible',
            skills: data.skills_required || [],
            

          });

          // Add AI response
          const aiResponseText = `I've analyzed your request. It looks like you need help with a ${data.urgency || ''} ${data.type} in ${data.domain}. I've estimated the budget around ₹${data.estimated_price}. Shall we proceed with this brief?`;

          const newAiMsg: Message = {
            id: (Date.now() + 1).toString(),
            text: aiResponseText,
            sender: 'ai',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, newAiMsg]);
        }
      }
    } catch (error) {
      console.error('Error parsing NLP:', error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting to the server. Please try again.",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
    

  };
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
      // Build payload matching backend/models/assignment.go
      const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080/api';

      // Prefer the NLP result if available; otherwise fall back to brief
      const src = nlpResult || {
        topic: brief.title,
        estimated_price: (() => {
          const cleaned = String(brief.budget || '').replace(/[^0-9\.\-]/g, '');
          const n = parseFloat(cleaned);
          return isNaN(n) ? 0 : n;
        })(),
        deadline: brief.deadline && brief.deadline !== 'Flexible' && brief.deadline !== '-' && brief.deadline !== 'Pending...' ? brief.deadline : null,
        skills_required: brief.skills || [],
        urgency: 'Medium'
      };

      const parsedPrice = (typeof src.estimated_price === 'number') ? src.estimated_price : (parseFloat(String(src.estimated_price || '0')) || 0);

      // Normalize deadline to ISO or null
      let deadlineValue: string | null = null;
      if (src.deadline) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(src.deadline)) {
          deadlineValue = `${src.deadline}T00:00:00Z`;
        } else {
          const d = new Date(src.deadline);
          if (!isNaN(d.getTime())) deadlineValue = d.toISOString();
        }
      }

      const payload = {
        userId: userId || undefined,
        title: src.topic || brief.title || 'Untitled Assignment',
        description: `Confirmed brief: ${src.topic || brief.title}`,
        pages: src.pages || 0,
        urgency: src.urgency || 'Medium',
        location: { latitude: lat, longitude: lon },
        price: parsedPrice,
        status: 'open',
        createdAt: new Date().toISOString(),
        lat: lat,
        lng: lon,
        skills: src.skills_required || [],
        deadline: deadlineValue,
        bidAmount: 0.0,
        raw_entities: nlpResult || {}
      };

      const resp = await axios.post(`${base}/assignment/create`, payload);
      // show confirmation in chat
      if (resp && (resp.status === 200 || resp.status === 201)) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 2).toString(),
          text: 'Project brief confirmed and sent to backend.',
          sender: 'ai',
          timestamp: new Date()
        }]);
        localStorage.setItem('latestBriefId', resp.data.data.id);
        router.push('/reciever/appoint');
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + 2).toString(),
          text: 'Could not save the brief — server returned ' + (resp?.status || 'unknown'),
          sender: 'ai',
          timestamp: new Date()
        }]);
      }
    } finally {
      setIsSharingLocation(false);
    }
  };
  return (
    <PageReveal className="h-screen">
      <div className="h-full w-full bg-black-primary relative overflow-hidden">
        {/* Ambient Background */}
 

        {/* Main Grid: Chat + Live Brief */}
        <div className="relative z-10 max-w-[1400px] mx-auto h-full px-4 md:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6 py-6">
          {/* Chat Column */}
          <div className="flex flex-col bg-transparent min-h-0">
            {/* Header */}
            <header className="flex items-center justify-between mb-4 p-4 rounded-xl glass-panel">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gold animate-pulse shadow-[0_0_10px_#D4AF37]" />
                <h1 className="text-white font-medium tracking-wide text-lg">
                  AI Project <span className="text-gold-gradient font-bold">Architect</span>
                </h1>
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-widest">Concierge Mode</div>
            </header>

            {/* Chat Box Container */}
            <div className="flex-1 min-h-0 flex flex-col bg-transparent">
              {/* Messages area */}
              <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto pr-2 pb-4 space-y-4 custom-scrollbar"
                aria-live="polite"
              >
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <motion.div
                      layout
                      key={msg.id}
                      initial={{ opacity: 0, y: 12, scale: 0.995 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.995 }}
                      transition={{ duration: 0.28, ease: 'easeOut' }}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[86%] md:max-w-[68%] p-4 rounded-2xl backdrop-blur-md border ${
                          msg.sender === 'user' 
                            ? 'bg-gradient-to-br from-[#1B1B1B] to-[#0F0F0F] border-gold/25 text-white rounded-tr-none' 
                            : 'bg-black-secondary/80 border-white/5 text-gray-200 rounded-tl-none shadow-lg'
                        }`}
                      >
                        <p className="leading-relaxed text-sm md:text-base">{msg.text}</p>
                        <div className="mt-2 text-[10px] text-gray-500 opacity-70 text-right">
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Typing indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-black-secondary/60 border border-white/6 px-4 py-3 rounded-2xl rounded-tl-none flex gap-2 items-center">
                      <span className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
                      <span className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
                      <span className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input - sticky to bottom of chat column */}
              <div className="mt-4">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-gold/20 to-gold-light/20 rounded-xl blur opacity-20 group-hover:opacity-60 transition duration-500 pointer-events-none"></div>
                  <form onSubmit={handleSendMessage} className="relative flex items-center gap-3 bg-black-secondary border border-white/8 rounded-xl p-2 shadow-xl">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Describe your project (e.g. 'I need a 3D website for my portfolio...')"
                      className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none py-3 px-3"
                      aria-label="Type your project description"
                    />
                    <Button 
                      type="submit" 
                      size="md" 
                      className="rounded-lg px-5 bg-gold-gradient text-black font-bold hover:shadow-[0_0_20px_rgba(212,175,55,0.22)]"
                      disabled={!inputValue.trim() || isTyping}
                    >
                      Send
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Live Brief Panel (desktop) */}
            <aside className="hidden md:block w-full">
            <div className="h-full sticky top-6 p-6 border-l border-white/5 bg-black-secondary/30 backdrop-blur-xl rounded-xl overflow-y-auto custom-scrollbar">
              <h2 className="text-xs font-bold text-gold uppercase tracking-widest mb-6">Live Project Brief</h2>

              <div className="space-y-6">
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Project Title</label>
                <div className="text-white font-medium border-b border-white/6 pb-2">
                {brief.title}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Est. Budget</label>
                <div className="text-gold font-mono text-lg border-b border-white/6 pb-2">
                {brief.budget}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Deadline</label>
                <div className="text-white font-medium border-b border-white/6 pb-2">
                {brief.deadline}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">Detected Skills</label>
                <div className="flex flex-wrap gap-2">
                {brief.skills.length > 0 ? brief.skills.map(skill => (
                  <span key={skill} className="text-xs bg-white/5 text-gold px-2 py-1 rounded border border-gold/20">
                  {skill}
                  </span>
                )) : <span className="text-gray-600 text-xs italic">Waiting for input...</span>}
                </div>
              </div>

              <div className="mt-6 p-4 rounded-lg bg-gold/5 border border-gold/10">
                <p className="text-xs text-gray-400 leading-relaxed">
                <span className="text-gold">AI Note:</span> I am analyzing your requirements in real-time to match you with the top 1% of solvers.
                </p>
              </div>

              {/* Confirm button */}
              <div className="mt-4">
                <Button
                type="button"
                size="md"
                className="w-full rounded-lg px-4 bg-gold-gradient text-black font-bold hover:shadow-[0_0_20px_rgba(212,175,55,0.22)]"
                disabled={brief.title === 'Pending...'}
                onClick={() => {
                  if (brief.title === 'Pending...') {
                  alert('Please provide project details before confirming.');
                  return;
                  }else{
   handleConfirmBrief();
                  }
               
                  // Simple confirmation action — replace with real handler as needed
                 
                }}
                >
                Confirm Brief
                </Button>
              </div>
              </div>
            </div>
            </aside>
        </div>
      </div>
    </PageReveal>
  );
}
