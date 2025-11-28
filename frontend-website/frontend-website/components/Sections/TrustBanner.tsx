'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function TrustBanner() {
  return (
    <section className="w-full py-20 bg-gradient-to-b from-black-primary to-black-secondary border-y border-white/5 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm"
          >
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-bold text-white mb-2">Escrow Protection</h3>
            <p className="text-gray-400">
              Funds are held securely in escrow until the work is approved. 100% money-back guarantee.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm"
          >
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-white mb-2">Verified Solvers</h3>
            <p className="text-gray-400">
              Every solver is vetted for skills and identity. Quality you can trust.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm"
          >
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-bold text-white mb-2">24/7 Support</h3>
            <p className="text-gray-400">
              Our dedicated support team is always here to help resolve any issues.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
