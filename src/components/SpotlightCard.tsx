import { useState, useRef } from 'react';
import type { MouseEvent, ReactNode, HTMLAttributes } from 'react';

interface SpotlightCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  glowColor?: string;
  glowSize?: number;
}

export default function SpotlightCard({ 
  children, 
  className = '', 
  id,
  glowColor = 'rgba(16, 185, 129, 0.12)', // Default emerald theme glow
  glowSize = 350,
  style,
  ...props
}: SpotlightCardProps) {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isFocused, setIsFocused] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseEnter = () => setIsFocused(true);
  const handleMouseLeave = () => setIsFocused(false);

  return (
    <div
      ref={divRef}
      id={id}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`card ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        ...style
      }}
      {...props}
    >
      {/* Dynamic radial gradient light overlay */}
      {isFocused && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 1,
            background: `radial-gradient(${glowSize}px circle at ${coords.x}px ${coords.y}px, ${glowColor}, transparent 80%)`,
            transition: 'background 0.1s ease'
          }}
        />
      )}
      
      {/* Content wrapper ensuring zIndex visibility */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {children}
      </div>
    </div>
  );
}
