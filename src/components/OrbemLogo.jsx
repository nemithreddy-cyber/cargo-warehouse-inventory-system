import React, { useId } from 'react';

export default function OrbemLogo({ className = "w-6 h-6" }) {
  const uniqueId = useId().replace(/:/g, '');
  const outerGradientId = `orbem-gradient-outer-${uniqueId}`;
  const innerGradientId = `orbem-gradient-inner-${uniqueId}`;
  const glowId = `orbem-glow-${uniqueId}`;

  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer Glow Orbit */}
      <circle cx="50" cy="50" r="42" stroke={`url(#${glowId})`} strokeWidth="4" strokeLinecap="round" strokeDasharray="180 50" />
      {/* Inner Rotating Ring */}
      <circle cx="50" cy="50" r="32" stroke={`url(#${outerGradientId})`} strokeWidth="6" strokeLinecap="round" />
      {/* Outer Core Orbit Nodes */}
      <circle cx="50" cy="8" r="5" fill="#f59e0b" className="animate-pulse" />
      <circle cx="50" cy="92" r="5" fill="#3b82f6" className="animate-pulse" />
      
      {/* Core Sphere */}
      <circle cx="50" cy="50" r="18" fill={`url(#${innerGradientId})`} filter="drop-shadow(0px 4px 8px rgba(59, 130, 246, 0.4))" />
      
      {/* Dynamic Gradients */}
      <defs>
        <linearGradient id={outerGradientId} x1="8" y1="8" x2="92" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3b82f6" /> {/* Blue-500 */}
          <stop offset="50%" stopColor="#8b5cf6" /> {/* Purple-500 */}
          <stop offset="100%" stopColor="#f59e0b" /> {/* Amber-500 */}
        </linearGradient>
        <linearGradient id={innerGradientId} x1="32" y1="32" x2="68" y2="68" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563eb" /> {/* Blue-600 */}
          <stop offset="100%" stopColor="#1e3a8a" /> {/* Blue-900 */}
        </linearGradient>
        <linearGradient id={glowId} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
        </linearGradient>
      </defs>
    </svg>
  );
}

