'use client';

import React, { Suspense, useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, Stars, Sparkles, Cloud } from '@react-three/drei';
import { useReducedMotion } from 'framer-motion';
import { HeroCard3D } from './HeroCard3D';
import * as THREE from 'three';

interface Hero3DSceneProps {
  mode: string;
}

function FallingLeaves() {
  const count = 80;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    return new Array(count).fill(0).map(() => ({
      x: (Math.random() - 0.5) * 25,
      y: Math.random() * 20 - 10,
      z: (Math.random() - 0.5) * 15 - 5,
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
      speed: 0.01 + Math.random() * 0.04,
      spin: (Math.random() - 0.5) * 0.02
    }));
  }, []);

  const leafShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.3, 0.3, 0.3, 0.8, 0, 1.2);
    shape.bezierCurveTo(-0.3, 0.8, -0.3, 0.3, 0, 0);
    return shape;
  }, []);

  useFrame(() => {
    if (!mesh.current) return;
    const instance = mesh.current;
    
    particles.forEach((p, i) => {
      p.y -= p.speed;
      p.rotation[0] += p.spin;
      p.rotation[1] += p.spin;

      if (p.y < -12) {
        p.y = 12;
        p.x = (Math.random() - 0.5) * 25;
      }

      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.rotation[0], p.rotation[1], p.rotation[2]);
      dummy.scale.set(0.3, 0.3, 0.3);
      dummy.updateMatrix();
      instance.setMatrixAt(i, dummy.matrix);
    });
    instance.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <shapeGeometry args={[leafShape]} />
      <meshStandardMaterial 
        color="#D4AF37" 
        side={THREE.DoubleSide} 
        transparent 
        opacity={0.9} 
        metalness={1} 
        roughness={0.3} 
      />
    </instancedMesh>
  );
}

function AnimatedCardGroup({ targetZ, children }: { targetZ: number, children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.position.z = THREE.MathUtils.lerp(
        groupRef.current.position.z,
        targetZ,
        2 * delta
      );
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

function SceneContent({ mode, shouldReduceMotion }: { mode: string, shouldReduceMotion: boolean | null }) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredCard, setHoveredCard] = useState<'front' | 'back' | null>(null);

  useFrame((state) => {
    if (groupRef.current && !shouldReduceMotion) {
      // Scroll effect: Rotate the entire background group based on scroll position
      // We can access window.scrollY directly or use a scroll library. 
      // For simplicity in this setup, we'll use a subtle time-based rotation + scroll if available
      const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.05 + (scrollY * 0.0005);
      groupRef.current.position.y = -(scrollY * 0.002);
    }
  });

  const getBgColor = () => {
    switch (mode) {
      case 'night': return '#050510';
      case 'aurora': return '#0a001a';
      case 'midnight': return '#000000'; // Deepest black
      case 'noir': default: return '#0A0A0A';
    }
  };

  return (
    <>
      <color attach="background" args={[getBgColor()]} />
      
      {/* Lighting Changes based on Mode */}
      <ambientLight intensity={0.5} />
      <pointLight 
        position={[10, 10, 10]} 
        intensity={1.5} 
        color={mode === 'aurora' ? '#00ffcc' : '#F4D03F'} 
      />
      <pointLight 
        position={[-10, -10, -10]} 
        intensity={0.5} 
        color={mode === 'aurora' ? '#ff00ff' : '#D4AF37'} 
      />
      <spotLight position={[0, 5, 0]} intensity={0.8} angle={0.5} penumbra={1} />

      {/* Environment for reflections */}
      <Environment preset="city" />

      {/* Floating Cards */}
      {shouldReduceMotion ? (
        <group>
            <AnimatedCardGroup targetZ={hoveredCard === 'back' ? -0.2 : 0.2}>
              <HeroCard3D variant="front" offset={-0.8} onHover={(h) => h && setHoveredCard('front')} />
            </AnimatedCardGroup>
            <AnimatedCardGroup targetZ={hoveredCard === 'back' ? 0.2 : -0.2}>
              <HeroCard3D variant="back" offset={0.8} onHover={(h) => h && setHoveredCard('back')} />
            </AnimatedCardGroup>
        </group>
      ) : (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <AnimatedCardGroup targetZ={hoveredCard === 'back' ? -0.2 : 0.2}>
            <HeroCard3D variant="front" offset={-0.8} onHover={(h) => h && setHoveredCard('front')} />
          </AnimatedCardGroup>
          <AnimatedCardGroup targetZ={hoveredCard === 'back' ? 0.2 : -0.2}>
            <HeroCard3D variant="back" offset={0.8} onHover={(h) => h && setHoveredCard('back')} />
          </AnimatedCardGroup>
        </Float>
      )}

      {/* Dynamic Background Elements */}
      <group ref={groupRef}>
        {!shouldReduceMotion && (
          <>
            {mode === 'noir' && (
              <FallingLeaves />
            )}
            {mode === 'night' && (
              <Stars radius={100} depth={50} count={7000} factor={4} saturation={1} fade speed={2} />
            )}
            {mode === 'aurora' && (
              <>
                <Sparkles count={200} scale={12} size={4} speed={0.4} opacity={0.5} color="#00ffcc" />
                <Sparkles count={200} scale={10} size={6} speed={0.3} opacity={0.5} color="#ff00ff" />
              </>
            )}
            {mode === 'midnight' && (
               <Sparkles count={300} scale={15} size={2} speed={0.2} opacity={0.8} color="#ffffff" />
            )}
          </>
        )}
      </group>
    </>
  );
}

export function Hero3DScene({ mode = 'noir' }: Hero3DSceneProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 35 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <SceneContent mode={mode} shouldReduceMotion={shouldReduceMotion} />
        </Suspense>
      </Canvas>
    </div>
  );
}
