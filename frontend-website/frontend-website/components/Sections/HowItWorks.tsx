'use client';

import React from 'react';
import { motion } from 'framer-motion';

const steps = [
  {
    id: 1,
    title: 'Submit Assignment',
    description: 'Upload your task details, set a budget, and define your deadline. Private and secure.',
    icon: (
      <svg className="w-8 h-8 text-black-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  {
    id: 2,
    title: 'Review & Hire',
    description: 'Browse skilled solvers, check ratings, and chat before you hire. Funds are held in escrow.',
    icon: (
      <svg className="w-8 h-8 text-black-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    id: 3,
    title: 'Deliver & Pay',
    description: 'Receive your completed work. Release payment only when you are 100% satisfied.',
    icon: (
      <svg className="w-8 h-8 text-black-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
];

export function HowItWorks() {
  return (
    <section className="w-full py-24 bg-black-secondary relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            How It <span className="text-gold-gradient">Works</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            A simple, secure process to get your tasks done or earn money.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gray-800 -z-10">
             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-gold/30 to-transparent opacity-50" />
          </div>

          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="flex flex-col items-center text-center group"
            >
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full bg-black-primary border border-gold/30 flex items-center justify-center group-hover:border-gold transition-colors duration-500 shadow-[0_0_20px_rgba(212,175,55,0.1)] group-hover:shadow-[0_0_30px_rgba(212,175,55,0.3)]">
                  <div className="w-16 h-16 rounded-full bg-gold-gradient flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500">
                    {step.icon}
                  </div>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-black-secondary border border-gold flex items-center justify-center text-gold font-bold text-sm">
                  {step.id}
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-gold transition-colors">
                {step.title}
              </h3>
              <p className="text-gray-400 leading-relaxed max-w-xs">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
