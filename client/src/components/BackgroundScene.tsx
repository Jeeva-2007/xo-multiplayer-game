"use client";

import { Canvas } from "@react-three/fiber";
import { Float, OrbitControls, Sparkles } from "@react-three/drei";

function FloatingCube({ position }: { position: [number, number, number] }) {
  return (
    <Float floatIntensity={2} rotationIntensity={2} speed={2}>
      <mesh position={position} castShadow receiveShadow>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshStandardMaterial
          color="#8b45ff"
          emissive="#7b2cff"
          emissiveIntensity={0.75}
          metalness={0.6}
          roughness={0.1}
        />
      </mesh>
    </Float>
  );
}

function FloatingRing({ position }: { position: [number, number, number] }) {
  return (
    <Float floatIntensity={1} rotationIntensity={1} speed={1.5}>
      <mesh position={position} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2, 0.1, 16, 100]} />
        <meshStandardMaterial
          color="#00e5ff"
          emissive="#00b4cc"
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
    </Float>
  );
}

export function BackgroundScene() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <Sparkles count={40} size={1.15} speed={0.6} color="#9b63ff" />
        <FloatingCube position={[-2, 1.5, -1]} />
        <FloatingCube position={[2, -1, 0]} />
        <FloatingCube position={[0, -2, -2]} />
        <FloatingRing position={[0, 0, -3]} />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.6} />
      </Canvas>
    </div>
  );
}
