'use client';
import { useEffect } from 'react';
import { recordEvent } from '@/lib/events';
export function ProductView({ id, demo }: { id: string; demo: boolean }) {
  useEffect(() => { if (!demo) recordEvent(id, 'PRODUCT_VIEW'); }, [id, demo]);
  return null;
}
