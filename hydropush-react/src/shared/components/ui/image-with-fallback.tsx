// src/components/ui/image-with-fallback.tsx
import React, { useState } from 'react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
}

export function ImageWithFallback({ 
  src, 
  alt, 
  className = '', 
  fallback,
  onError,
  ...props 
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setError(true);
    onError?.(e);
  };

  if (error) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div 
        className={`flex items-center justify-center bg-muted text-muted-foreground ${className}`}
        {...props as React.HTMLAttributes<HTMLDivElement>}
      >
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          className="opacity-50"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className={className}
      onError={handleError}
      {...props}
    />
  );
}