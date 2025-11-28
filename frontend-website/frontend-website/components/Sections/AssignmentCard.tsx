'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../UI/Button';

interface AssignmentCardProps {
  title: string;
  budget: string;
  deadline: string;
  skills: string[];
  description: string;
  index?: number;
}

export function AssignmentCard({ title, budget, deadline, skills, description, index = 0 }: AssignmentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative p-6 rounded-xl bg-black-secondary border border-white/5 hover:border-gold/30 transition-all duration-300 hover:-translate-y-1"
    >
      {/* Hover Glow Effect */}
      <div className="absolute inset-0 rounded-xl bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <div className="bg-white/5 px-3 py-1 rounded-full text-xs text-gold border border-gold/20">
            {deadline}
          </div>
          <div className="text-xl font-bold text-white">
            {budget}
          </div>
        </div>

        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-gold-light transition-colors line-clamp-2">
          {title}
        </h3>
        
        <p className="text-gray-400 text-sm mb-6 line-clamp-3 flex-grow">
          {description}
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {skills.map((skill) => (
            <span key={skill} className="text-xs text-gray-500 bg-black-primary px-2 py-1 rounded border border-white/5">
              {skill}
            </span>
          ))}
        </div>

        <Button variant="outline" size="sm" className="w-full group-hover:bg-gold group-hover:text-black-primary group-hover:border-gold hover:bg-gold! hover:text-black">
          Place Bid
        </Button>
      </div>
    </motion.div>
  );
}
