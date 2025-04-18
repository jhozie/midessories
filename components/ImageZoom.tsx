'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ImageZoomProps {
  children: React.ReactNode;
  src: string;
  alt: string;
}

export default function ImageZoom({ src, alt }: ImageZoomProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isZoomed) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setPosition({ x, y });
  };

  return (
    <div 
      className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 cursor-zoom-in"
      onMouseEnter={() => setIsZoomed(true)}
      onMouseLeave={() => setIsZoomed(false)}
      onMouseMove={handleMouseMove}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className={`object-cover transition-transform duration-200 ${
          isZoomed ? 'scale-150' : 'scale-100'
        }`}
        style={{
          transformOrigin: `${position.x}% ${position.y}%`
        }}
        priority
      />
    </div>
  );
} 