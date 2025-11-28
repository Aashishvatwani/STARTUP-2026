'use client';

import React from 'react';
import { Button } from '../UI/Button';

export function Footer() {
  return (
    <footer className="w-full bg-black-secondary border-t border-white/5 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-2xl font-bold text-white mb-6">
              Homework<span className="text-gold">ing</span>
            </h3>
            <p className="text-gray-400 mb-6">
              The premium marketplace for academic and professional assignments. Secure, fast, and reliable.
            </p>
            <div className="flex gap-4">
              {/* Social Icons Placeholder */}
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gold hover:bg-gold hover:text-black-primary transition-colors cursor-pointer">
                <span className="font-bold">X</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gold hover:bg-gold hover:text-black-primary transition-colors cursor-pointer">
                <span className="font-bold">in</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gold hover:bg-gold hover:text-black-primary transition-colors cursor-pointer">
                <span className="font-bold">Ig</span>
              </div>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="text-white font-bold mb-6">Platform</h4>
            <ul className="space-y-4 text-gray-400">
              <li className="hover:text-gold cursor-pointer transition-colors">Browse Assignments</li>
              <li className="hover:text-gold cursor-pointer transition-colors">How it Works</li>
              <li className="hover:text-gold cursor-pointer transition-colors">Pricing</li>
              <li className="hover:text-gold cursor-pointer transition-colors">Trust & Safety</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Support</h4>
            <ul className="space-y-4 text-gray-400">
              <li className="hover:text-gold cursor-pointer transition-colors">Help Center</li>
              <li className="hover:text-gold cursor-pointer transition-colors">Terms of Service</li>
              <li className="hover:text-gold cursor-pointer transition-colors">Privacy Policy</li>
              <li className="hover:text-gold cursor-pointer transition-colors">Contact Us</li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div>
            <h4 className="text-white font-bold mb-6">Stay Updated</h4>
            <p className="text-gray-400 mb-4">
              Subscribe to get the latest opportunities and platform updates.
            </p>
            <div className="flex flex-col gap-3">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full bg-black-primary border border-white/10 rounded-md px-4 py-3 text-white focus:outline-none focus:border-gold transition-colors"
                suppressHydrationWarning
              />
              <Button size="sm">Subscribe</Button>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © 2025 Homeworking. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            <span className="hover:text-white cursor-pointer">Privacy</span>
            <span className="hover:text-white cursor-pointer">Terms</span>
            <span className="hover:text-white cursor-pointer">Sitemap</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
