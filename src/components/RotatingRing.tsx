import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface RingProps {
  radius?: number;
  tube?: number;
  color?: string;
  speed?: number;
  axis?: "x" | "y" | "z";
  tilt?: number;
}

export default function RotatingRing({
  radius = 3,
  tube = 0.02,
  color = "#10b981",
  speed = 0.2,
  axis = "y",
  tilt = 0,
}: RingProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    if (axis === "x") meshRef.current.rotation.x = time * speed + tilt;
    if (axis === "y") meshRef.current.rotation.y = time * speed + tilt;
    if (axis === "z") meshRef.current.rotation.z = time * speed + tilt;
  });

  return (
    <mesh ref={meshRef}>
      <torusGeometry args={[radius, tube, 16, 100]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
        transparent
        opacity={0.4}
        wireframe
      />
    </mesh>
  );
}
