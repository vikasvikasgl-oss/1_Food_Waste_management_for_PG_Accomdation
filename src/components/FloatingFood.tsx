import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const foodShapes = [
  // Apple-like sphere
  { geometry: new THREE.SphereGeometry(0.3, 16, 16), color: "#ef4444" },
  // Banana-like cylinder
  { geometry: new THREE.CapsuleGeometry(0.15, 0.5, 4, 8), color: "#fbbf24" },
  // Bread-like box
  { geometry: new THREE.BoxGeometry(0.4, 0.2, 0.3), color: "#d97706" },
  // Leaf-like plane
  { geometry: new THREE.ConeGeometry(0.2, 0.4, 4), color: "#22c55e" },
  // Milk carton
  { geometry: new THREE.BoxGeometry(0.25, 0.4, 0.25), color: "#3b82f6" },
  // Egg
  { geometry: new THREE.SphereGeometry(0.2, 16, 16), color: "#fef3c7" },
];

interface FloatingFoodProps {
  count?: number;
  radius?: number;
}

export default function FloatingFood({ count = 30, radius = 5 }: FloatingFoodProps) {
  const groupRef = useRef<THREE.Group>(null);

  const items = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const shape = foodShapes[i % foodShapes.length];
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * (0.5 + Math.random() * 0.5);
      return {
        geometry: shape.geometry,
        color: shape.color,
        position: new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        ),
        rotationSpeed: {
          x: (Math.random() - 0.5) * 0.02,
          y: (Math.random() - 0.5) * 0.02,
          z: (Math.random() - 0.5) * 0.02,
        },
        orbitSpeed: 0.1 + Math.random() * 0.2,
        orbitOffset: Math.random() * Math.PI * 2,
        scale: 0.5 + Math.random() * 0.5,
      };
    });
  }, [count, radius]);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      const item = items[i];
      child.rotation.x += item.rotationSpeed.x;
      child.rotation.y += item.rotationSpeed.y;
      child.rotation.z += item.rotationSpeed.z;

      const t = state.clock.elapsedTime * item.orbitSpeed + item.orbitOffset;
      child.position.x = item.position.x + Math.sin(t) * 0.5;
      child.position.y = item.position.y + Math.cos(t * 0.7) * 0.3;
      child.position.z = item.position.z + Math.sin(t * 0.5) * 0.5;
    });
  });

  return (
    <group ref={groupRef}>
      {items.map((item, i) => (
        <mesh key={i} position={item.position} scale={item.scale}>
          <primitive object={item.geometry} attach="geometry" />
          <meshStandardMaterial
            color={item.color}
            emissive={item.color}
            emissiveIntensity={0.2}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}
    </group>
  );
}
