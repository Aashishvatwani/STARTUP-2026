'use client';

import React, { useRef, useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { OrbitControls, Stars, Html, Float, Sparkles, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { PageReveal } from '@/components/UI/PageReveal';
import { Button } from '@/components/UI/Button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Procedural shader materials (Sun & Planet)
// We'll create ShaderMaterial instances inline. No external images required.

// --- GLSL helpers (IQ noise) ---
const iqNoiseGLSL = `
/* IQ's classic 2D noise */
vec3 hash3(vec2 p) {
  vec3 q = vec3( dot(p, vec2(127.1,311.7)),
                 dot(p, vec2(269.5,183.3)),
                 dot(p, vec2(419.2,371.9)) );
  return -1.0 + 2.0 * fract(sin(q) * 43758.5453123);
}
float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix( dot(hash3(i + vec2(0.0,0.0)).xy, f - vec2(0.0,0.0)),
                   dot(hash3(i + vec2(1.0,0.0)).xy, f - vec2(1.0,0.0)), u.x),
             mix( dot(hash3(i + vec2(0.0,1.0)).xy, f - vec2(0.0,1.0)),
                   dot(hash3(i + vec2(1.0,1.0)).xy, f - vec2(1.0,1.0)), u.x),
             u.y);
}
float fbm(vec2 p){
  float v = 0.0;
  float a = 0.5;
  for(int i=0;i<5;i++){
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}
`;

// --- Sun shader ---
const sunVertex = `
varying vec3 vNormal;
varying vec3 vPosition;
void main(){
  vNormal = normalMatrix * normal;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vPosition = mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`;

const sunFragment = `
uniform float uTime;
uniform vec3 uColor;
varying vec3 vNormal;
varying vec3 vPosition;

${iqNoiseGLSL}

void main(){
  // base lighting using normal and view
  vec3 N = normalize(vNormal);
  vec3 V = normalize(-vPosition);

  // animated noise (screen-space)
  float n = fbm((vNormal.xy + vec2(uTime * 0.08)) * 3.0);

  // rim based on view angle
  float rim = pow(1.0 - max(0.0, dot(N, V)), 1.5);

  // core glow
  float core = smoothstep(0.6, -0.2, length(vPosition) * 0.35);

  vec3 color = uColor * (1.0 + n * 0.45) + vec3(1.0,0.85,0.6) * core * 1.6 + vec3(1.0,0.6,0.12) * rim * 0.6;

  // final tone
  gl_FragColor = vec4(color, 1.0);
}
`;

// --- Planet shader ---
const planetVertex = `
varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec2 vUv;
void main(){
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const planetFragment = `
uniform float uTime;
uniform vec3 uBaseColor;
uniform float uMetallic;
uniform float uRoughness;
varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec2 vUv;

${iqNoiseGLSL}

void main(){
  // normal and simple lighting approximation
  vec3 N = normalize(vNormal);
  vec3 L = normalize(vec3(0.6, 0.8, 0.3)); // directional light
  vec3 V = normalize(-vWorldPos);

  // multi-scale noise for surface detail
  float n = fbm(vUv * 6.0 + vec2(uTime * 0.06));
  float n2 = fbm(vUv * 18.0 - vec2(uTime * 0.12));

  // color variation
  vec3 base = uBaseColor * (0.85 + n * 0.4) + vec3(0.05) * n2;

  // diffuse term
  float diff = max(dot(N, L), 0.0);

  // rim / fresnel
  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);

  // specular approximation
  float spec = pow(max(dot(normalize(reflect(-L, N)), V), 0.0), mix(8.0, 64.0, 1.0 - uRoughness));

  // combine
  vec3 color = base * diff * (1.0 - 0.2 * uMetallic) + vec3(0.9) * spec * (0.2 + 0.8 * uMetallic) + fresnel * 0.08;

  gl_FragColor = vec4(color, 1.0);
}
`;

// Mock Data for Solvers (fallback)
const SOLVERS = [
  { id: 1, name: "Alex Chen", role: "Full Stack Dev", rate: "$60/hr", color: "#D4AF37" },
  { id: 2, name: "Sarah Jones", role: "UI/UX Designer", rate: "$85/hr", color: "#F4D03F" },
  { id: 3, name: "Mike Ross", role: "Backend Engineer", rate: "$70/hr", color: "#CD7F32" },
  { id: 4, name: "Emily Blunt", role: "3D Artist", rate: "$90/hr", color: "#C0C0C0" },
  { id: 5, name: "David Kim", role: "Smart Contract Dev", rate: "$120/hr", color: "#B8860B" },
];

const COLOR_PALETTE = ["#D4AF37", "#F4D03F", "#CD7F32", "#C0C0C0", "#B8860B", "#9ACD32", "#7FB3D5"];

// --- React wrappers for materials ---
function SunMesh({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.getElapsedTime();
  });

  const uniforms = useMemo(() => ({
    uTime: { value: 0.0 },
    uColor: { value: new THREE.Color('#FFD27A') },
  }), []);

  return (
    <Float speed={1.2} rotationIntensity={0.14} floatIntensity={0.22}>
      <group position={position}>
        <mesh castShadow>
          <sphereGeometry args={[2.7, 64, 64]} />
          <shaderMaterial
            ref={matRef}
            vertexShader={sunVertex}
            fragmentShader={sunFragment}
            uniforms={uniforms}
            transparent={false}
            depthWrite={true}
          />
        </mesh>

        {/* soft outer glow as a translucent mesh */}
        <mesh scale={[1.35, 1.35, 1.35]}>
          <sphereGeometry args={[2.7, 64, 64]} />
          <meshBasicMaterial color={'#FFD27A'} transparent opacity={0.12} side={THREE.BackSide} />
        </mesh>

        <Sparkles size={6} scale={[4, 4, 4]} count={24} speed={0.6} />

        <Html position={[0, 3.2, 0]} center distanceFactor={15} style={{ pointerEvents: 'none' }} zIndexRange={[100, 0]}>
          <div className="bg-black/60 backdrop-blur-md border border-gold/30 px-4 py-2 rounded-full text-center shadow-[0_0_20px_rgba(255,210,122,0.3)]">
            <div className="text-gold font-bold text-sm tracking-wider">YOUR PROJECT</div>
          </div>
        </Html>
      </group>
    </Float>
  );
}

function PlanetMesh({ solver, radius, speed, offset, onSelect }: { solver: any, radius: number, speed: number, offset: number, onSelect: (id: number) => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const [hovered, setHovered] = useState(false);

  const baseColor = useMemo(() => new THREE.Color(solver.color), [solver.color]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed + offset;
    if (groupRef.current && !hovered) {
      groupRef.current.position.x = Math.cos(t) * radius;
      groupRef.current.position.z = Math.sin(t) * radius;
    }
    // rotate irrespective of hover for subtle motion
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003 + (hovered ? 0.01 : 0.002);
      meshRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.25 + offset) * 0.02;
    }
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uBaseColor: { value: baseColor },
    uMetallic: { value: 0.05 },
    uRoughness: { value: 0.55 },
  }), [baseColor]);

  // initials for avatar replacement
  const initials = solver.name.split(' ').map((s: string) => s[0]).join('').slice(0, 2).toUpperCase();

  return (
    <group>
      {/* orbit ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.02, radius + 0.02, 128]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.06} side={THREE.DoubleSide} />
      </mesh>

      <group ref={groupRef}>
        <mesh
          ref={meshRef}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          onClick={() => onSelect(solver.id)}
          castShadow
          receiveShadow
        >
          <sphereGeometry args={[0.85, 64, 64]} />
          <shaderMaterial
            ref={matRef}
            vertexShader={planetVertex}
            fragmentShader={planetFragment}
            uniforms={uniforms}
            transparent={false}
          />
        </mesh>

        {/* HTML card (initials instead of image) */}
        <Html position={[0, 1.6, 0]} center distanceFactor={12} style={{ pointerEvents: 'none' }} zIndexRange={[100, 0]}>
          <div className={`transition-all duration-200 ${hovered ? 'opacity-100 scale-105' : 'opacity-85 scale-95'}`}>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full border-2 border-gold overflow-hidden mb-2 shadow-[0_0_12px_rgba(0,0,0,0.6)] bg-black flex items-center justify-center text-white font-bold">
                {initials}
              </div>
              <div className="bg-black/80 backdrop-blur-md border border-white/10 p-3 rounded-xl text-center min-w-[120px] shadow-xl">
                <div className="text-white font-bold text-sm">{solver.name}</div>
                <div className="text-gold text-xs mb-1">{solver.role}</div>
                <div className="text-gray-400 text-[10px]">{solver.rate}</div>
              </div>
            </div>
          </div>
        </Html>
      </group>
    </group>
  );
}

// --- Page component ---
export default function AppointSolverPage() {
  const router = useRouter();
  const [matchedSolvers, setMatchedSolvers] = useState<any[] | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  async function fetchMatchedSolvers() {
    try {
      setIsFetching(true);
      const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080/api';

      // Minimal assignment payload; in a full flow you would derive this from the current brief
      const payload = {
        description: 'Build a responsive landing page in Next.js and Tailwind with contact form',
        location: { latitude: 0, longitude: 0 },
      };

      const res = await axios.post(`${base}/match/solvers`, payload);
      if (res?.data && Array.isArray(res.data)) {
        // Backend returns array of { User: {...}, Score: number }
        const mapped = res.data.map((s: any, idx: number) => {
          const user = s.User || s.user || s;
          const id = (user && (user.id || user._id)) || String(idx + 1);
          return {
            id,
            name: user?.name || `Solver ${idx + 1}`,
            role: user?.role || 'solver',
            rate: user?.price_per_job ? `₹${user.price_per_job}` : (user?.pricePerJob ? `₹${user.pricePerJob}` : '$---'),
            color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
            score: s.Score || s.score || 0,
          };
        });
        setMatchedSolvers(mapped);
        return mapped;
      }
    } catch (err) {
      console.error('Failed to fetch matched solvers', err);
    } finally {
      setIsFetching(false);
    }
    return null;
  }

  const handleSelectSolver = (id: number) => {
    router.push('/reciever/appoint/solver-details');
  };

  return (
    <PageReveal>
      <div className="h-screen w-full bg-black-primary relative overflow-hidden">
        {/* UI Overlay */}
        <div className="absolute top-0 left-0 w-full p-6 z-10 flex justify-between items-start pointer-events-none">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1 pointer-events-auto">Select Your <span className="text-gold-gradient">Solver</span></h1>
            <p className="text-gray-400 text-sm max-w-md">Explore the galaxy of talent. Hover over a planet to view profile details. Click to appoint.</p>
          </div>
          <Link href="/reciever/chatbox" className="pointer-events-auto">
            <Button variant="outline" size="sm">Back to Brief</Button>
          </Link>
        </div>

        {/* 3D Scene */}
        <div className="absolute inset-0 z-0">
          <Canvas camera={{ position: [0, 10, 16], fov: 45 }} shadows>
            <color attach="background" args={['#050505']} />
            <fog attach="fog" args={['#050505', 10, 50]} />

            {/* Environment (preset) for subtle reflections on ShaderMaterial lighting approximations */}
            <Environment preset="sunset" background={false} />

            <ambientLight intensity={0.35} />
            <directionalLight
              castShadow
              position={[6, 10, 6]}
              intensity={1.0}
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
            />
            <pointLight position={[10, 10, 10]} intensity={0.5} />

            <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

            <SunMesh />

            {(matchedSolvers || SOLVERS).map((solver, i) => (
              <PlanetMesh
                key={solver.id}
                solver={solver}
                radius={5 + i * 1.8}
                speed={0.18 + (i % 2 === 0 ? 0.05 : -0.05)}
                offset={i * (Math.PI * 2 / SOLVERS.length)}
                onSelect={handleSelectSolver}
              />
            ))}

            <OrbitControls
              enablePan={false}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={Math.PI / 2}
              minDistance={8}
              maxDistance={30}
            />
          </Canvas>
        </div>

        {/* Bottom Action Bar */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
            <div className="glass-panel px-6 py-3 rounded-full flex items-center gap-4">
            <span className="text-gray-400 text-sm">{(matchedSolvers || SOLVERS).length} Solvers found matching your criteria</span>
            <div className="h-4 w-px bg-white/10"></div>
            <Button size="sm" className="rounded-full" onClick={async () => {
              const list = await fetchMatchedSolvers();
              if (list && list.length > 0) {
                handleSelectSolver(list[0].id);
              } else {
                // fallback: pick first of SOLVERS
                handleSelectSolver(SOLVERS[0].id);
              }
            }} disabled={isFetching}>{isFetching ? 'Finding...' : 'Auto-Assign Best Match'}</Button>
          </div>
        </div>
      </div>
    </PageReveal>
  );
}
