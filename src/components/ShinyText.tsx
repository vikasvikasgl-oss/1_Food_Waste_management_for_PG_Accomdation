import type { CSSProperties } from 'react';

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
}

export default function ShinyText({ 
  text, 
  disabled = false, 
  speed = 5, 
  className = '' 
}: ShinyTextProps) {
  const animationStyle: CSSProperties = disabled ? {} : {
    animationName: 'shiny-sweep',
    animationDuration: `${speed}s`,
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
    background: 'linear-gradient(120deg, rgba(255,255,255,0) 35%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0) 65%)',
    backgroundSize: '200% 100%',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    color: 'var(--text-secondary)',
    display: 'inline-block'
  };

  return (
    <span 
      className={`shiny-text ${className}`} 
      style={animationStyle}
    >
      {text}
    </span>
  );
}
