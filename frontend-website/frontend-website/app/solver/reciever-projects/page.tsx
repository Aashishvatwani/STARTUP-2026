'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageReveal } from '@/components/UI/PageReveal';
import { Button } from '@/components/UI/Button';
import { Notification } from '@/components/UI/Notification';
import Link from 'next/link';

// Types
type ProjectStatus = 'pending' | 'in-progress' | 'completed';

interface Project {
  id: string;
  title: string;
  clientName: string;
  budget: string;
  deadline: string;
  status: ProjectStatus;
  description: string;
  progress: number; // 0-100
}

// Mock Data
const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    title: 'DeFi Dashboard UI',
    clientName: 'John Doe',
    budget: '$2,500',
    deadline: 'Dec 15, 2025',
    status: 'in-progress',
    description: 'Create a responsive dashboard for a decentralized finance protocol with real-time data visualization.',
    progress: 65
  },
  {
    id: '2',
    title: 'NFT Marketplace Smart Contracts',
    clientName: 'CryptoArt Inc.',
    budget: '$4,000',
    deadline: 'Nov 30, 2025',
    status: 'pending',
    description: 'Develop ERC-721 smart contracts with royalty enforcement and auction mechanics.',
    progress: 0
  },
  {
    id: '3',
    title: 'Corporate Landing Page',
    clientName: 'TechFlow Systems',
    budget: '$1,200',
    deadline: 'Oct 20, 2025',
    status: 'completed',
    description: 'Modern landing page with 3D elements and scroll animations.',
    progress: 100
  }
];

export default function SolverProjectsPage() {
  const [filter, setFilter] = useState<'active' | 'completed'>('active');
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'info' }>({
    show: false,
    message: '',
    type: 'info'
  });

  const filteredProjects = projects.filter(p => 
    filter === 'active' ? (p.status === 'pending' || p.status === 'in-progress') : p.status === 'completed'
  );

  const handleMarkComplete = (id: string) => {
    setProjects(prev => prev.map(p => 
      p.id === id ? { ...p, status: 'completed', progress: 100 } : p
    ));
    setNotification({
      show: true,
      message: 'Project marked as completed successfully!',
      type: 'success'
    });
  };

  return (
    <PageReveal>
      <div className="min-h-screen w-full bg-black-primary relative overflow-y-auto custom-scrollbar pb-20">
        
        {/* Header */}
        <div className="sticky top-0 z-50 bg-black-primary/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/solver/dashboard">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                ← Dashboard
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-white">My Projects</h1>
          </div>
          <div className="flex gap-2 bg-white/5 p-1 rounded-lg">
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                filter === 'active' ? 'bg-gold text-black shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                filter === 'completed' ? 'bg-green-500 text-black shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-10">
          
          <AnimatePresence mode="popLayout">
            {filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {filteredProjects.map((project) => (
                  <motion.div
                    key={project.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-black-secondary border border-white/10 rounded-xl p-6 hover:border-gold/30 transition-colors group"
                  >
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      
                      {/* Project Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-white group-hover:text-gold transition-colors">
                            {project.title}
                          </h3>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            project.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                            project.status === 'in-progress' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          }`}>
                            {project.status.replace('-', ' ')}
                          </span>
                        </div>
                        
                        <p className="text-gray-400 text-sm mb-4 max-w-2xl">
                          {project.description}
                        </p>

                        <div className="flex flex-wrap gap-6 text-sm">
                          <div>
                            <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Client</div>
                            <div className="text-white font-medium">{project.clientName}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Budget</div>
                            <div className="text-gold font-mono">{project.budget}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Deadline</div>
                            <div className="text-white font-medium">{project.deadline}</div>
                          </div>
                        </div>
                      </div>

                      {/* Actions & Progress */}
                      <div className="flex flex-col justify-between items-end min-w-[200px]">
                        <div className="w-full mb-4 md:mb-0">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Progress</span>
                            <span>{project.progress}%</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${
                                project.status === 'completed' ? 'bg-green-500' : 'bg-gold-gradient'
                              }`}
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex gap-3 w-full md:w-auto mt-4">
                          <Link href="/solver/reciever-projects/chatcomponent">
                            <Button variant="outline" size="sm" className="w-full md:w-auto border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                              AI Help
                            </Button>
                          </Link>
                          <Link href="/solver/negotiation">
                            <Button variant="outline" size="sm" className="w-full md:w-auto">
                              Chat
                            </Button>
                          </Link>
                          
                          {project.status !== 'completed' && (
                            <Button 
                              size="sm" 
                              className="w-full md:w-auto bg-gold-gradient text-black font-bold"
                              onClick={() => handleMarkComplete(project.id)}
                            >
                              Mark Complete
                            </Button>
                          )}
                        </div>
                      </div>

                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <div className="text-6xl mb-4 opacity-20">📂</div>
                <h3 className="text-xl font-bold text-white mb-2">No projects found</h3>
                <p className="text-gray-400">You don't have any {filter} projects at the moment.</p>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        <Notification
          id="project-action"
          isVisible={notification.show}
          onClose={() => setNotification(prev => ({ ...prev, show: false }))}
          message={notification.message}
          type={notification.type}
        />

      </div>
    </PageReveal>
  );
}
