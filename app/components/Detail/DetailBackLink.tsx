'use client';

import Link from 'next/link';
import type { BackNavigation } from '@/app/hooks/useBackNavigation';

export function DetailBackLink({ label, onClick, href }: BackNavigation) {
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="text-blue-600 hover:underline mb-4 inline-block bg-transparent border-0 p-0"
      >
        ← {label}
      </button>
    );
  }

  return (
    <Link href={href || '/'} className="text-blue-600 hover:underline mb-4 inline-block">
      ← {label}
    </Link>
  );
}
