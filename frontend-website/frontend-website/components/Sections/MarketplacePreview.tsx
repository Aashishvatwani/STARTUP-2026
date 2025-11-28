'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AssignmentCard } from './AssignmentCard';
import { Button } from '../UI/Button';

const sampleAssignments = [
  {
    id: 1,
    title: 'Build a React Native E-commerce App',
    budget: '₹15,000 - ₹25,000',
    deadline: '7 Days',
    skills: ['React Native', 'Firebase', 'Stripe'],
    description: 'Looking for an experienced developer to build a cross-platform mobile app for a fashion brand. Must include cart, checkout, and user profiles.'
  },
  {
    id: 2,
    title: 'Python Script for Data Scraping',
    budget: '₹5,000 - ₹8,000',
    deadline: '2 Days',
    skills: ['Python', 'BeautifulSoup', 'Selenium'],
    description: 'Need a script to scrape product data from 3 competitor websites. Output should be in CSV format with daily auto-run capability.'
  },
  {
    id: 3,
    title: 'Logo Design for Tech Startup',
    budget: '₹3,000 - ₹6,000',
    deadline: '3 Days',
    skills: ['Adobe Illustrator', 'Branding', 'Minimalist'],
    description: 'We need a modern, minimalist logo for our AI startup. Gold and black color scheme preferred. Deliverables include vector files.'
  },
  {
    id: 4,
    title: 'SEO Optimization for WordPress Site',
    budget: '₹8,000 - ₹12,000',
    deadline: '5 Days',
    skills: ['SEO', 'WordPress', 'Content Writing'],
    description: 'Audit and optimize our existing blog for better ranking. Keyword research, meta tags, and speed optimization required.'
  },
  {
    id: 5,
    title: 'Smart Contract for NFT Collection',
    budget: '₹20,000 - ₹40,000',
    deadline: '10 Days',
    skills: ['Solidity', 'Ethereum', 'Web3.js'],
    description: 'Develop an ERC-721 smart contract for a generative art collection. Include whitelist functionality and royalty enforcement.'
  },
  {
    id: 6,
    title: 'Video Editor for YouTube Channel',
    budget: '₹2,000 - ₹4,000',
    deadline: '1 Day',
    skills: ['Premiere Pro', 'After Effects', 'Storytelling'],
    description: 'Edit a 10-minute tech review video. Raw footage provided. Need engaging cuts, B-roll, and background music.'
  }
];

export function MarketplacePreview() {
  return (
    <section className="w-full py-24 bg-black-primary relative">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Latest <span className="text-gold-gradient">Assignments</span>
            </h2>
            <p className="text-gray-400 max-w-xl">
              Browse high-quality tasks from verified clients. Bid now and start earning.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Button variant="ghost" className="group">
              View All Assignments 
              <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </Button>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sampleAssignments.map((assignment, index) => (
            <AssignmentCard 
              key={assignment.id}
              {...assignment}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
