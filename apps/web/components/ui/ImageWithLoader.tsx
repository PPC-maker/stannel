'use client';

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';

interface ImageWithLoaderProps extends ImageProps {
  spinnerSize?: number;
}

/**
 * Image component with a centered spinner that shows while the image loads.
 * Drop-in replacement for next/image - pass all the same props.
 */
export default function ImageWithLoader({ spinnerSize = 28, className, onLoad, ...props }: ImageWithLoaderProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {/* Spinner overlay - visible until image loads */}
      {!loaded && (
        <div className="absolute inset-0 z-[1] flex items-center justify-center bg-white/5">
          <div
            className="rounded-full border-2 border-white/20 border-t-white/70 animate-spin"
            style={{ width: spinnerSize, height: spinnerSize }}
          />
        </div>
      )}
      <Image
        {...props}
        className={className}
        onLoad={(e) => {
          setLoaded(true);
          if (onLoad) onLoad(e);
        }}
      />
    </>
  );
}

/**
 * Same but for regular <img> tags (not next/image)
 */
export function ImgWithLoader({
  spinnerSize = 28,
  className,
  onLoad,
  onError,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement> & { spinnerSize?: number }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) return null;

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 z-[1] flex items-center justify-center bg-white/5">
          <div
            className="rounded-full border-2 border-white/20 border-t-white/70 animate-spin"
            style={{ width: spinnerSize, height: spinnerSize }}
          />
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        {...props}
        className={className}
        onLoad={(e) => {
          setLoaded(true);
          if (onLoad) onLoad(e);
        }}
        onError={(e) => {
          setError(true);
          if (onError) onError(e);
        }}
      />
    </>
  );
}
