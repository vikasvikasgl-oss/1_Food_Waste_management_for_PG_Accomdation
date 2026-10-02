import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { countryData } from "../data/foodWasteData";

function latLngToVector3(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function CountryMarker({
  position,
  waste,
  country,
  isHovered,
  onHover,
  onLeave,
}: {
  position: THREE.Vector3;
  waste: number;
  country: string;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const scale = Math.max(0.04, Math.min(0.15, waste / 500));

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.scale.setScalar(
      scale * (1 + Math.sin(state.clock.elapsedTime * 2 + waste) * 0.1) * (isHovered ? 1.5 : 1)
    );
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={onHover}
        onPointerOut={onLeave}
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          color={isHovered ? "#fbbf24" : "#ef4444"}
          emissive={isHovered ? "#f59e0b" : "#dc2626"}
          emissiveIntensity={isHovered ? 0.8 : 0.4}
          transparent
          opacity={0.9}
        />
      </mesh>
      {isHovered && (
        <Html distanceFactor={8}>
          <div className="bg-stone-900/90 backdrop-blur-md text-white px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap border border-stone-700 shadow-xl pointer-events-none">
            <div className="text-amber-400">{country}</div>
            <div>{waste}M tonnes/year</div>
          </div>
        </Html>
      )}
    </group>
  );
}

export default function WasteGlobe() {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const markers = useMemo(() => {
    return countryData.map((c) => ({
      ...c,
      position: latLngToVector3(c.lat, c.lng, 2),
    }));
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Globe wireframe */}
      <mesh>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial
          color="#1c1917"
          wireframe
          transparent
          opacity={0.15}
        />
      </mesh>
      {/* Globe inner glow */}
      <mesh>
        <sphereGeometry args={[1.98, 64, 64]} />
        <meshStandardMaterial
          color="#064e3b"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>
      {/* Country markers */}
      {markers.map((m) => (
        <CountryMarker
          key={m.country}
          position={m.position}
          waste={m.totalWaste}
          country={m.country}
          isHovered={hoveredCountry === m.country}
          onHover={() => setHoveredCountry(m.country)}
          onLeave={() => setHoveredCountry(null)}
        />
      ))}
      {/* Atmosphere glow */}
      <mesh>
        <sphereGeometry args={[2.3, 32, 32]} />
        <meshStandardMaterial
          color="#10b981"
          transparent
          opacity={0.03}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}
