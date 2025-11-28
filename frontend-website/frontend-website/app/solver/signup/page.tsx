'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/UI/Button';
import { PageReveal } from '@/components/UI/PageReveal';
import { useState } from 'react';
import axios from 'axios';
export default function SolverSignupPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  async function handleSignup() {
    try {
      const response = await axios.post('/api/auth/register', { firstName, lastName, email, password ,role:'solver' });
      console.log('Signup successful', response.data);
    } catch (error) {
      console.error('Signup failed', error);
    }
  }
  return (
    <PageReveal>
      <div className="min-h-screen w-full flex items-center justify-center bg-black-primary relative overflow-hidden p-4">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-gold/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-gold/5 rounded-full blur-[120px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-lg glass-panel p-8 rounded-2xl relative z-10"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Become a <span className="text-gold-gradient">Solver</span></h1>
            <p className="text-gray-400 text-sm">Join our elite network of experts.</p>
          </div>

          <form className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                <input 
                  type="text" 
                  className="w-full bg-black-secondary border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold transition-colors"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                <input 
                  type="text" 
                  className="w-full bg-black-secondary border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold transition-colors"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

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
              <label className="block text-sm font-medium text-gray-300 mb-2">Primary Skill</label>
              <select className="w-full bg-black-secondary border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold transition-colors appearance-none">
                <option value="" disabled defaultValue="Select your expertise" className="text-black">Select your expertise</option>
                <option value="programming" className="text-black">Programming & Tech</option>
                <option value="design" className="text-black">Graphic Design</option>
                <option value="writing" className="text-black">Writing & Translation</option>
                <option value="marketing" className="text-black">Digital Marketing</option>
                <option value="video" className="text-black">Video & Animation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input 
                type="password" 
                className="w-full bg-black-secondary border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold transition-colors"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-start gap-3 pt-2">
              <input type="checkbox" className="mt-1 accent-gold" />
              <p className="text-xs text-gray-400">
                I agree to the <a href="#" className="text-gold hover:underline">Terms of Service</a> and <a href="#" className="text-gold hover:underline">Privacy Policy</a>.
              </p>
            </div>

            <Button className="w-full" size="lg" onClick={handleSignup}>
              Apply Now
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link href="/solver/login" className="text-gold hover:text-gold-light font-medium transition-colors">
              Log In
            </Link>
          </div>
        </motion.div>
      </div>
    </PageReveal>
  );
}
