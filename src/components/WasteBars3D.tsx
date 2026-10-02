import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { sectorData } from "../data/foodWasteData";

function Bar3D({
  position,
  height,
  color,
  label,
  value,
  delay,
}: {
  position: [number, number, number];
  height: number;
  color: string;
  label: string;
  value: number;
  delay: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetHeight = useRef(0);
  const started = useRef(false);

  useFrame((state) => {
    if (!meshRef.current) return;
    if (!started.current && state.clock.elapsedTime > delay) {
      started.current = true;
    }
    if (started.current) {
      targetHeight.current = THREE.MathUtils.lerp(targetHeight.current, height, 0.03);
      meshRef.current.scale.y = targetHeight.current;
      meshRef.current.position.y = targetHeight.current / 2;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <boxGeometry args={[0.8, 1, 0.8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          transparent
          opacity={0.9}
        />
      </mesh>
      <Html position={[0, height + 0.5, 0]} center distanceFactor={10}>
        <div className="text-center pointer-events-none">
          <div className="text-white text-xs font-bold bg-stone-900/80 px-2 py-1 rounded">{label}</div>
          <div className="text-emerald-400 text-[10px] font-semibold mt-0.5">{value}M t</div>
        </div>
      </Html>
    </group>
  );
}

export default function WasteBars3D() {
  const maxWaste = Math.max(...sectorData.map((s) => s.waste));

  const bars = useMemo(() => {
    return sectorData.map((s, i) => ({
      position: [(i - 1) * 2.5, 0, 0] as [number, number, number],
      height: (s.waste / maxWaste) * 4,
      color: s.color,
      label: s.sector,
      value: s.waste,
      delay: i * 0.5 + 1,
    }));
  }, [maxWaste]);

  return (
    <group position={[0, -1, 0]}>
      {/* Base platform */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[8, 0.1, 3]} />
        <meshStandardMaterial color="#292524" />
      </mesh>
      {/* Grid lines */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[-4 + i * 2, 0.01, 0]}>
          <boxGeometry args={[0.02, 0.02, 3]} />
          <meshStandardMaterial color="#44403c" transparent opacity={0.3} />
        </mesh>
      ))}
      {bars.map((bar) => (
        <Bar3D key={bar.label} {...bar} />
      ))}
    </group>
  );
}
