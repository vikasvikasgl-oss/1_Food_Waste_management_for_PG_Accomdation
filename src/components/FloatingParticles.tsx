import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ParticlesProps {
  count?: number;
  color?: string;
  size?: number;
  speed?: number;
  spread?: number;
}

export default function FloatingParticles({
  count = 200,
  color = "#10b981",
  size = 0.03,
  speed = 0.3,
  spread = 10,
}: ParticlesProps) {
  const meshRef = useRef<THREE.Points>(null);

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 2] = (Math.random() - 0.5) * spread;
      vel[i * 3] = (Math.random() - 0.5) * speed * 0.01;
      vel[i * 3 + 1] = (Math.random() - 0.5) * speed * 0.01;
      vel[i * 3 + 2] = (Math.random() - 0.5) * speed * 0.01;
    }
    return [pos, vel];
  }, [count, speed, spread]);

  useFrame(() => {
    if (!meshRef.current) return;
    const posArray = meshRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      posArray[i * 3] += velocities[i * 3];
      posArray[i * 3 + 1] += velocities[i * 3 + 1];
      posArray[i * 3 + 2] += velocities[i * 3 + 2];

      if (Math.abs(posArray[i * 3]) > spread / 2) velocities[i * 3] *= -1;
      if (Math.abs(posArray[i * 3 + 1]) > spread / 2) velocities[i * 3 + 1] *= -1;
      if (Math.abs(posArray[i * 3 + 2]) > spread / 2) velocities[i * 3 + 2] *= -1;
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
