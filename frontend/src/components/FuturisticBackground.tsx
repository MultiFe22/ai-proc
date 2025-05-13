import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

const AnimatedSphere = ({ position, scale, speed, distort }: { 
  position: [number, number, number]; 
  scale: number; 
  speed: number;
  distort: number;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed) * 0.2;
  });

  return (
    <Sphere args={[1, 32, 32]} scale={scale} position={position} ref={meshRef}>
      <MeshDistortMaterial 
        color="#88ccff" 
        attach="material" 
        distort={distort} 
        speed={2} 
        roughness={0.2} 
        metalness={0.8}
        opacity={0.6}
        transparent
      />
    </Sphere>
  );
};

export const FuturisticBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-black to-gray-900">
      <div className="absolute inset-0 opacity-40">
        <Canvas camera={{ position: [0, 0, 5] }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <AnimatedSphere position={[-3, 0, 0]} scale={1.5} speed={0.6} distort={0.4} />
          <AnimatedSphere position={[3, 1, -2]} scale={2} speed={0.4} distort={0.3} />
          <AnimatedSphere position={[0, -2, -1]} scale={1} speed={0.5} distort={0.2} />
        </Canvas>
      </div>
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
    </div>
  );
};
