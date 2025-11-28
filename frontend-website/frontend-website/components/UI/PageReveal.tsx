'use client';

import React from 'react';
import { motion, useReducedMotion, Variants } from 'framer-motion';

type Props = {
  children: React.ReactNode;
  shimmer?: boolean;            // golden sheen sweep (default: true)
  staggerChildren?: boolean;    // automatically stagger direct children (default: true)
  className?: string;
};

export function PageReveal({
  children,
  shimmer = true,
  staggerChildren = true,
  className = '',
}: Props) {
  const prefersReducedMotion = useReducedMotion();

  // Container variants (mount animation)
  const containerVariants = {
    initial: {
      opacity: 0,
      scale: 1.05,
      filter: 'blur(10px)',
      y: 10,
      rotateX: 1.8, // tiny 3D tilt
    },
    animate: {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      y: 0,
      rotateX: 0,
      transition: {
        duration: 1.1,
        ease: [0.25, 1, 0.5, 1], // "Apple-style" ease-out
        delay: 0.12,
      },
    },
  };

  // Reduced motion variant for container
  const reducedContainerVariants = {
    initial: { opacity: 1, scale: 1, filter: 'blur(0px)', y: 0, rotateX: 0 },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)', y: 0, rotateX: 0 },
  };

  // Child variant for simple stagger
  const childVariant = {
    initial: { opacity: 0, y: 12 },
    animate: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6, ease: [0.2, 0.9, 0.2, 1] } 
    },
  };

  const reducedChildVariant = {
    initial: { opacity: 1, y: 0 },
    animate: { opacity: 1, y: 0 },
  };

  // Shimmer animation (gold sheen)
  const shimmerAnim: Variants = {
    initial: { x: '-120%' },
    animate: { 
      x: '120%', 
      transition: { duration: 1.15, ease: "easeOut", delay: 0.45 } 
    },
  };

  const activeContainerVariants = prefersReducedMotion ? reducedContainerVariants : containerVariants;
  const activeChildVariant = prefersReducedMotion ? reducedChildVariant : childVariant;

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={activeContainerVariants}
      style={{
        perspective: 1200, // gives a subtle 3D depth for rotateX
        willChange: 'opacity, transform, filter',
        backfaceVisibility: 'hidden',
      }}
      className={`relative w-full min-h-screen overflow-hidden ${className}`}
    >
      {/* optional gold shimmer overlay - hidden if reduced motion to avoid distraction */}
      {shimmer && !prefersReducedMotion && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-start justify-center z-10"
        >
          <motion.div
            variants={shimmerAnim}
            className="absolute top-10 left-0 h-48 w-1/2 transform -skew-x-12 opacity-30"
            style={{
              background:
                'linear-gradient(90deg, rgba(10,10,10,0) 0%, rgba(212,175,55,0.32) 45%, rgba(212,175,55,0.18) 55%, rgba(10,10,10,0) 100%)',
              filter: 'blur(8px)',
              mixBlendMode: 'screen',
            }}
          />
        </motion.div>
      )}

      {/* wrapper for children — optionally stagger direct children */}
      {staggerChildren ? (
        <motion.div
          className="h-full w-full"
          variants={{
            initial: {},
            animate: { 
              transition: { 
                staggerChildren: prefersReducedMotion ? 0 : 0.07, 
                when: 'beforeChildren' 
              } 
            },
          }}
        >
          {React.Children.map(children, (child) =>
            React.isValidElement(child) ? (
              <motion.div variants={activeChildVariant} style={{ transformStyle: 'preserve-3d' }} className="h-full w-full">
                {child}
              </motion.div>
            ) : (
              child
            )
          )}
        </motion.div>
      ) : (
        <div className="h-full w-full">{children}</div>
      )}
    </motion.div>
  );
}
