'use client';

import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  alt: string;
  size: number; // px — intrinsic width/height для next/image
  className?: string; // розмір і додаткові класи (w-*, h-*, shrink-0, sm:w-* тощо)
}

export function Avatar({ src, alt, size, className = '' }: AvatarProps) {
  if (!src) return null;

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
    />
  );
}
