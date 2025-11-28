'use client';

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCursor, Text, RoundedBox, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { Group } from 'three';

interface HeroCard3DProps {
  variant: 'front' | 'back';
  offset?: number;
  onHover?: (isHovered: boolean) => void;
}

export function HeroCard3D({ variant, offset = 0, onHover }: HeroCard3DProps) {
  const meshRef = useRef<Group>(null);
  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);
  
  useCursor(hovered);

  const handlePointerOver = () => {
    setHover(true);
    onHover?.(true);
  };

  const handlePointerOut = () => {
    setHover(false);
    onHover?.(false);
  };

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Idle float animation
    const t = state.clock.getElapsedTime();
    meshRef.current.position.y = Math.sin(t * 0.5 + offset) * 0.1;
    meshRef.current.rotation.z = Math.cos(t * 0.3 + offset) * 0.05;

    // Mouse interaction (tilt)
    const x = state.pointer.x;
    const y = state.pointer.y;
    
    const targetRotationX = (y * 0.2) + (active ? Math.PI : 0);
    const targetRotationY = (x * 0.2);

    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRotationX, delta * 2);
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRotationY, delta * 2);
  });

  const cardColor = variant === 'front' ? '#0A0A0A' : '#161616';
  const goldColor = '#D4AF37';

  return (
    <group 
      ref={meshRef} 
      position={[offset * 1.2, 0, 0]}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={() => setActive(!active)}
    >
      {/* Card Body */}
      <RoundedBox args={[3.2, 2, 0.05]} radius={0.1} smoothness={4}>
        <meshStandardMaterial 
          color={cardColor} 
          roughness={0.3} 
          metalness={0.8}
        />
      </RoundedBox>

      {/* Gold Border/Edge */}
      <RoundedBox args={[3.22, 2.02, 0.04]} radius={0.1} smoothness={4}>
        <meshStandardMaterial color={goldColor} metalness={1} roughness={0.2} />
      </RoundedBox>

      {/* Content */}
      <group position={[0, 0, 0.06]}>
        {variant === 'front' ? (
          <>
            <Text 
              position={[-1.2, 0.6, 0]} 
              fontSize={0.15} 
              color={goldColor}
              anchorX="left"
            >
              STUDENT CARD
            </Text>
            <Text 
              position={[-1.4, 0, 0]} 
              fontSize={0.25} 
              color="white"
              anchorX="left"
              letterSpacing={0.1}
            >
              **** **** **** 4242
            </Text>
            <Text 
              position={[-1.2, -0.6, 0]} 
              fontSize={0.12} 
              color="#888"
              anchorX="left"
            >
              Aashish Vatwani
            </Text>
            
          </>
        ) : (
          <>
          
           
            
             <Text 
              position={[-1.2, 0.6, 0]} 
              fontSize={0.15} 
              color={goldColor}
              anchorX="left"
            >
              EARNER CARD
            </Text>
             <Text 
              position={[-1.4, 0, 0]} 
              fontSize={0.25} 
              color="white"
              anchorX="left"
              letterSpacing={0.1}
            >
              **** **** **** 3452
            </Text>
            <Text 
              position={[0, -0.5, 0]} 
              fontSize={0.1} 
              color={goldColor}
            >
              SECURE PAYMENT
            </Text>
            
          </>
        )}
      </group>
    </group>
  );
}
