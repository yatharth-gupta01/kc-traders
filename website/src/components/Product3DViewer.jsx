import React, { useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html, Float, ContactShadows, useProgress } from '@react-three/drei';
import * as THREE from 'three';

const Loader = () => {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-mustard-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-mustard-500 font-bold uppercase tracking-widest text-xs whitespace-nowrap">
          Loading 3D Engine {Math.round(progress)}%
        </p>
      </div>
    </Html>
  );
};

const ProceduralBottle = ({ color = "#f59e0b" }) => {
  const points = useMemo(() => {
    const pts = [];
    // Base center
    pts.push(new THREE.Vector2(0.001, -4.0));
    
    // Base curve
    for (let i = 0; i <= 5; i++) {
       const t = i / 5;
       // from center to 1.8 radius
       pts.push(new THREE.Vector2(1.8 * t, -4.0));
    }
    
    // Bottom edge rounding
    pts.push(new THREE.Vector2(1.9, -3.9));
    pts.push(new THREE.Vector2(2.0, -3.7));
    
    // Straight body up to shoulder
    pts.push(new THREE.Vector2(2.0, 1.0));
    
    // Shoulder curve
    pts.push(new THREE.Vector2(1.9, 1.5));
    pts.push(new THREE.Vector2(1.7, 2.0));
    pts.push(new THREE.Vector2(1.4, 2.4));
    pts.push(new THREE.Vector2(1.0, 2.7));
    pts.push(new THREE.Vector2(0.7, 3.0));
    
    // Neck
    pts.push(new THREE.Vector2(0.6, 3.5));
    pts.push(new THREE.Vector2(0.6, 4.5));
    
    // Lip
    pts.push(new THREE.Vector2(0.75, 4.6));
    pts.push(new THREE.Vector2(0.75, 4.9));
    pts.push(new THREE.Vector2(0.6, 5.0));
    
    // Top center opening (closed for geometry)
    pts.push(new THREE.Vector2(0.001, 5.0));
    return pts;
  }, []);

  return (
    <group>
      {/* 3D Bottle Geometry with Advanced Glass/Liquid Refraction Material */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <latheGeometry args={[points, 64]} />
        <meshPhysicalMaterial 
          color={color}           
          transmission={0.98}     // Glass transparency allowing light through
          opacity={1}
          metalness={0.1}
          roughness={0.05}        // Highly polished smooth glass
          ior={1.52}              // Index of Refraction (standard glass)
          thickness={3.0}         // Internal volume thickness (simulates liquid mass)
          clearcoat={1.0}         // Surface gloss
          clearcoatRoughness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Animated Floating Label inside the 3D scene (using HTML wrapper) */}
      <Html position={[0, -1, 2.1]} transform occlude center>
        <div className="w-40 h-48 bg-[#0a0500]/80 backdrop-blur-md border border-mustard-500/50 rounded-xl p-4 flex flex-col items-center justify-center pointer-events-none select-none shadow-2xl overflow-hidden">
           <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-mustard-500 via-amber-200 to-mustard-500" />
           
           <div className="w-8 h-8 rounded-full border border-mustard-500/50 flex items-center justify-center mb-3">
             <div className="w-4 h-4 bg-mustard-500 rounded-sm rotate-45" />
           </div>
           
           <p className="text-[10px] tracking-[0.3em] text-mustard-400 font-black uppercase text-center mb-1">Premium</p>
           <h3 className="text-white font-display font-bold text-center text-lg leading-tight uppercase">Mustard<br/>Oil</h3>
           
           <div className="w-10 h-px bg-mustard-500/40 my-3" />
           
           <div className="text-[9px] text-slate-300 font-medium tracking-wider uppercase">Cold Pressed</div>
        </div>
      </Html>

      {/* Bottle Cap Structure */}
      <group position={[0, 5.15, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.7, 0.7, 0.4, 32]} />
          <meshStandardMaterial color="#1e293b" metalness={0.4} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.75, 0.75, 0.1, 32]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
};

const Product3DViewer = ({ oilColor = "#f59e0b" }) => {
  return (
    <div className="w-full h-full min-h-[500px] md:min-h-[600px] relative cursor-grab active:cursor-grabbing bg-slate-50 dark:bg-earth-dark/50 rounded-3xl overflow-hidden shadow-inner">
      
      {/* Overlay UI Hint */}
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/10 dark:bg-white/10 backdrop-blur-sm">
          <svg className="w-4 h-4 text-slate-600 dark:text-slate-300 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-xs font-medium text-slate-700 dark:text-slate-200">Drag to Rotate</span>
        </div>
      </div>

      <Canvas camera={{ position: [0, 2, 12], fov: 45 }}>
        <Suspense fallback={<Loader />}>
          {/* Soft realistic lighting */}
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />
          
          {/* The 3D Object with gentle floating animation */}
          <Float speed={2} rotationIntensity={0.1} floatIntensity={0.5}>
            <ProceduralBottle color={oilColor} />
          </Float>
          
          {/* Realistic Ground Shadow */}
          <ContactShadows position={[0, -4.5, 0]} opacity={0.4} scale={20} blur={2} far={5} color="#000000" />
          
          {/* Realistic Environment reflections (Studio lighting preset) */}
          <Environment preset="studio" />
          
          {/* Interactive Controls */}
          <OrbitControls 
            enablePan={false}
            enableZoom={true}
            minDistance={8}
            maxDistance={18}
            minPolarAngle={Math.PI / 3} // Don't allow looking from under the bottom
            maxPolarAngle={Math.PI / 1.5} // Don't allow looking straight down from top
            autoRotate={true}
            autoRotateSpeed={1.0}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Product3DViewer;
