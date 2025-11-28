'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/UI/Button';
import { PageReveal } from '@/components/UI/PageReveal';
import { useState } from 'react';
import axios from 'axios';
export default function SolverLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
const handleLogin = async (e?: React.FormEvent | React.MouseEvent) => {
  if (e && 'preventDefault' in e) e.preventDefault();

  try {
    const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080/api';
    const response = await axios.post(`${base}/auth/login`, { email, password, role: 'solver' });
    console.log('Login successful', response.data);
  } catch (error) {
    console.error('Login failed', error);
  }
};

  return (
    <PageReveal>
      <div className="min-h-screen w-full flex items-center justify-center bg-black-primary relative overflow-hidden p-4">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-gold/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-gold/5 rounded-full blur-[100px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md glass-panel p-8 rounded-2xl relative z-10"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Solver <span className="text-gold-gradient">Login</span></h1>
            <p className="text-gray-400 text-sm">Access your dashboard and start earning.</p>
          </div>

          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <input 
                type="email" 
                className="w-full bg-black-secondary border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold transition-colors"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-300">Password</label>
                <a href="#" className="text-xs text-gold hover:text-gold-light transition-colors">Forgot?</a>
              </div>
              <input 
                type="password" 
                className="w-full bg-black-secondary border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button className="w-full" size="lg" onClick={handleLogin}>
              Sign In
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <Link href="/solver/signup" className="text-gold hover:text-gold-light font-medium transition-colors">
              Apply Now
            </Link>
          </div>
        </motion.div>
      </div>
    </PageReveal>
  );
}
