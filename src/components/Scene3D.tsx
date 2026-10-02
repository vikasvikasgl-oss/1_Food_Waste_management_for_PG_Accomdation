import { Suspense, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import FloatingParticles from "./FloatingParticles";
import WasteGlobe from "./WasteGlobe";
import WasteBars3D from "./WasteBars3D";
import FloatingFood from "./FloatingFood";
import RotatingRing from "./RotatingRing";

interface Scene3DProps {
  variant: "hero" | "globe" | "bars" | "food";
}

export default function Scene3D({ variant }: Scene3DProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  if (prefersReducedMotion) {
    return (
      <div 
        className="absolute inset-0 bg-gradient-to-b from-stone-950 via-black to-stone-950 pointer-events-none opacity-60"
        aria-hidden="true"
      />
    );
  }
  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.3} />
          <pointLight position={[10, 10, 10]} intensity={1} color="#10b981" />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#f4a261" />
          <directionalLight position={[5, 5, 5]} intensity={0.5} />

          {variant === "hero" && (
            <>
              <Stars radius={50} depth={50} count={1000} factor={3} saturation={0} fade speed={1} />
              <FloatingParticles count={300} color="#10b981" size={0.04} speed={0.5} spread={15} />
              <RotatingRing radius={4} color="#10b981" speed={0.1} axis="y" />
              <RotatingRing radius={5} color="#f4a261" speed={0.08} axis="x" tilt={0.5} />
              <RotatingRing radius={3.5} color="#2a9d8f" speed={0.12} axis="z" tilt={1} />
              <FloatingFood count={20} radius={6} />
            </>
          )}

          {variant === "globe" && (
            <>
              <Stars radius={30} depth={30} count={500} factor={2} fade />
              <FloatingParticles count={100} color="#ef4444" size={0.02} speed={0.2} spread={8} />
              <WasteGlobe />
              <OrbitControls
                enableZoom={false}
                enablePan={false}
                autoRotate
                autoRotateSpeed={0.5}
                minPolarAngle={Math.PI / 3}
                maxPolarAngle={Math.PI / 1.5}
              />
            </>
          )}

          {variant === "bars" && (
            <>
              <Stars radius={20} depth={20} count={300} factor={2} fade />
              <FloatingParticles count={80} color="#f4a261" size={0.03} speed={0.3} spread={10} />
              <WasteBars3D />
              <OrbitControls
                enableZoom={true}
                enablePan={false}
                autoRotate
                autoRotateSpeed={0.3}
                minPolarAngle={Math.PI / 4}
                maxPolarAngle={Math.PI / 2}
              />
            </>
          )}

          {variant === "food" && (
            <>
              <Stars radius={40} depth={40} count={800} factor={3} fade />
              <FloatingParticles count={200} color="#22c55e" size={0.05} speed={0.4} spread={12} />
              <FloatingFood count={50} radius={8} />
              <RotatingRing radius={6} color="#22c55e" speed={0.05} axis="y" />
              <RotatingRing radius={7} color="#ef4444" speed={0.03} axis="x" tilt={0.8} />
            </>
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
