'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { PageReveal } from '@/components/UI/PageReveal';
import { Button } from '@/components/UI/Button';
import Link from 'next/link';
import axios from 'axios';

export default function ReceiverLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

   const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 1. Call your custom backend directly
      // Make sure this URL points to your Go backend (e.g., http://localhost:8080/login)
      // or your proxy route.
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/login`, { email, password,role:'buyer' });
      
      console.log('Login successful', response.data);

      // 2. Store the user ID in localStorage (Simple Auth)
      // Ensure your backend returns { user: { id: "..." } } structure
      if (response.data.user && response.data.user.id) {
        localStorage.setItem('userId', response.data.user.id);
      }

      // 3. Redirect to Chatbox
      router.push('/reciever/chatbox');

    } catch (error) {
      console.error('Login failed', error);
      setError('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  
  return (
    <PageReveal>
      <div className="min-h-screen w-full flex items-center justify-center bg-black-primary relative overflow-hidden p-4">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-gold/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md glass-panel p-8 rounded-2xl relative z-10 border border-white/10"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-gray-400">Sign in to manage your projects</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">Email</label>
              <input 
                type="email" 
                required
                className="w-full bg-black-secondary border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold transition-colors"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">Password</label>
              <input 
                type="password" 
                required
                className="w-full bg-black-secondary border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gold-gradient text-black font-bold py-3 mt-4"
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Don't have an account?{' '}
              <Link href="/reciever/sign-up" className="text-gold hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </PageReveal>
  );
}