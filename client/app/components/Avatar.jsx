'use client';

import { useState, useEffect } from 'react';

export default function Avatar({ src, name, size = 40, className = "" }) {
  const [imgError, setImgError] = useState(false);

  // Reset error state if the source URL changes
  useEffect(() => {
    setImgError(false);
  }, [src]);

  // Generate Initials (Max 2 characters)
  const initials = name
    ? name
        .trim()
        .split(/\s+/) // Split by any whitespace
        .slice(0, 2)  // Take first 2 parts
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : '?';

  // Common dimensions object
  const dimensions = { 
    width: size, 
    height: size, 
    minWidth: size, 
    minHeight: size 
  };

  // Render Image
  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={`rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm bg-slate-100 dark:bg-slate-800 ${className}`}
        style={dimensions}
        onError={() => setImgError(true)}
        draggable={false}
      />
    );
  }

  // Render Fallback (Initials)
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold shadow-sm border-2 border-white dark:border-slate-800 select-none ${className}`}
      style={{ 
        ...dimensions, 
        fontSize: size / 2.5 
      }}
      title={name}
    >
      {initials}
    </div>
  );
}