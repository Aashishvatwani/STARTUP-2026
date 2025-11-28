'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Hero3DScene } from './Hero3DScene';
import { Button } from '../UI/Button';
import { BackgroundController, BackgroundMode } from './BackgroundController';
import { useRouter } from 'next/navigation';
export function HeroShell() {
  const [mode, setMode] = useState<BackgroundMode>('noir');
  const router = useRouter();

  return (
    <section className="relative w-full h-screen overflow-hidden bg-black-primary">
      {/* Background Controller UI */}
     
      <BackgroundController mode={mode} onModeChange={setMode} />
   
      {/* 3D Background */}
      <Hero3DScene mode={mode} />

      {/* Overlay Content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full px-4 text-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto pointer-events-auto"
        >
          
          <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-7xl text-white">
            Turn Tasks into <span className="text-gold-gradient">Income</span>
          </h1>
          
          

          <div className="flex flex-col gap-4 sm:flex-row justify-center items-center">
            <Button size="lg" className="min-w-[200px]" onClick={() => router.push('/reciever/login')}>
              Post Assignment (₹)
            </Button>
            <Button variant="outline" size="lg" className="min-w-[200px]" onClick={() => router.push('/solver/login')}>
              Become a Solver
            </Button>
          </div>
        </motion.div>

        {/* Bottom Chrome / Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-xs tracking-widest text-gold uppercase">Scroll to Explore</span>
          <div className="w-px h-12 bg-linear-to-b from-gold to-transparent" />
        </motion.div>
      </div>
      
      {/* Decorative Gradients */}
      <div className="absolute top-0 left-0 w-full h-32 bg-linear-to-b from-black-primary to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-32 bg-linear-to-t from-black-primary to-transparent z-10 pointer-events-none" />
    </section>
  );
}
