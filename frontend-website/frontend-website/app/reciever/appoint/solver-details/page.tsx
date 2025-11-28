'use client';

import React from 'react';
import { PageReveal } from '@/components/UI/PageReveal';
import { Button } from '@/components/UI/Button';
import Link from 'next/link';
import { motion } from 'framer-motion';

// Mock Data for the selected solver (matching ID 1 from the previous list)
const SOLVER_DETAILS = {
  id: 1,
  name: "Alex Chen",
  role: "Full Stack Developer",
  rate: "$60/hr",
  location: "San Francisco, CA",
  availability: "Available Now",
  bio: "Senior Full Stack Developer with 7+ years of experience building scalable web applications. Specialized in React, Node.js, and Web3 integrations. I focus on clean code, performance optimization, and delivering intuitive user experiences.",
  skills: ["React", "Next.js", "Node.js", "TypeScript", "Solidity", "AWS", "GraphQL"],
  stats: {
    successRate: "98%",
    completedJobs: 142,
    hoursWorked: "3,400+",
    responseTime: "< 1 hr"
  },
  portfolio: [
    { title: "DeFi Dashboard", category: "Web3", image: "bg-gradient-to-br from-purple-900 to-blue-900" },
    { title: "E-Commerce Platform", category: "Full Stack", image: "bg-gradient-to-br from-emerald-900 to-teal-900" },
    { title: "Social Graph App", category: "Mobile", image: "bg-gradient-to-br from-orange-900 to-red-900" }
  ],
  reviews: [
    { client: "TechCorp Inc.", rating: 5, text: "Alex is an absolute pro. Delivered the project ahead of schedule and the code quality was top notch." },
    { client: "StartupX", rating: 5, text: "Great communication and technical skills. Solved complex issues we were stuck on for weeks." }
  ]
};

export default function SolverDetailsPage() {
  return (
    <PageReveal>
      <div className="min-h-screen w-full bg-black-primary relative overflow-y-auto custom-scrollbar pb-20">
        
        {/* Header / Nav */}
        <div className="sticky top-0 z-50 bg-black-primary/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center">
          <Link href="/reciever/appoint">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white gap-2">
              <span>←</span> Back to Galaxy
            </Button>
          </Link>
          <div className="text-sm text-gray-500 uppercase tracking-widest">Solver Profile</div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-10">
          
          {/* Top Section: Profile Header */}
          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-10 mb-12">
            
            {/* Left: Avatar & Quick Actions */}
            <div className="flex flex-col gap-6">
              <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-gold/30 shadow-[0_0_30px_rgba(212,175,55,0.15)] bg-black-secondary group">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 z-10"></div>
                {/* Placeholder Avatar */}
                <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center text-6xl font-bold text-white/10 group-hover:text-gold/20 transition-colors">
                  AC
                </div>
                <div className="absolute bottom-4 left-4 z-20">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs text-green-400 font-medium">{SOLVER_DETAILS.availability}</span>
                  </div>
                  <div className="text-white font-bold text-lg">{SOLVER_DETAILS.rate}</div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Link href="/reciever/negotiation" className="w-full">
                  <Button size="lg" className="w-full bg-white text-black font-bold hover:bg-gray-200">
                    Start Chat
                  </Button>
                </Link>
                <Link href="/reciever/negotiation" className="w-full">
                  <Button size="lg" className="w-full bg-gold-gradient text-black font-bold hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                    ₹ Negotiate Price
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="w-full border-white/10 hover:bg-white/5">
                  Download Resume
                </Button>
              </div>
            </div>

            {/* Right: Info & Bio */}
            <div className="flex flex-col">
              <div className="mb-6">
                <h1 className="text-4xl font-bold text-white mb-2">{SOLVER_DETAILS.name}</h1>
                <div className="flex items-center gap-4 text-gray-400">
                  <span className="text-gold text-lg">{SOLVER_DETAILS.role}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                  <span>{SOLVER_DETAILS.location}</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {Object.entries(SOLVER_DETAILS.stats).map(([key, value]) => (
                  <div key={key} className="bg-white/5 border border-white/5 rounded-xl p-4">
                    <div className="text-2xl font-bold text-white mb-1">{value}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                  </div>
                ))}
              </div>

              <div className="prose prose-invert max-w-none mb-8">
                <h3 className="text-lg font-bold text-white mb-3">About</h3>
                <p className="text-gray-400 leading-relaxed">
                  {SOLVER_DETAILS.bio}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-4">Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {SOLVER_DETAILS.skills.map(skill => (
                    <span key={skill} className="px-3 py-1.5 rounded-lg bg-black-secondary border border-white/10 text-sm text-gray-300 hover:border-gold/30 hover:text-gold transition-colors cursor-default">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Portfolio & Reviews */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 border-t border-white/10 pt-10">
            
            {/* Portfolio */}
            <div>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                Selected Work <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-gray-400 font-normal">3</span>
              </h3>
              <div className="space-y-4">
                {SOLVER_DETAILS.portfolio.map((item, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    className="group relative h-48 rounded-xl overflow-hidden cursor-pointer"
                  >
                    <div className={`absolute inset-0 ${item.image}`}></div>
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
                    <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/90 to-transparent">
                      <div className="text-white font-bold text-lg">{item.title}</div>
                      <div className="text-gold text-sm">{item.category}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div>
              <h3 className="text-xl font-bold text-white mb-6">Client Reviews</h3>
              <div className="space-y-4">
                {SOLVER_DETAILS.reviews.map((review, i) => (
                  <div key={i} className="bg-black-secondary border border-white/5 p-6 rounded-xl">
                    <div className="flex justify-between items-start mb-3">
                      <div className="font-bold text-white">{review.client}</div>
                      <div className="flex text-gold text-xs">
                        {[...Array(review.rating)].map((_, i) => (
                          <span key={i}>★</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm italic">"{review.text}"</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </PageReveal>
  );
}
