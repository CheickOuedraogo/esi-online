'use client';

// Animation d'apparition au scroll : l'element glisse vers le centre
// (depuis la gauche, la droite ou le bas) lorsqu'il entre dans le viewport.

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type RevealFrom = 'left' | 'right' | 'up';

export interface RevealProps {
  children: React.ReactNode;
  from?: RevealFrom;
  delay?: number;
  className?: string;
}

const HIDDEN: Record<RevealFrom, string> = {
  left: 'opacity-0 -translate-x-8',
  right: 'opacity-0 translate-x-8',
  up: 'opacity-0 translate-y-8',
};

export function Reveal({ children, from = 'up', delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        'transition-all duration-700 ease-out will-change-transform',
        'motion-reduce:transform-none motion-reduce:opacity-100 motion-reduce:transition-none',
        visible ? 'translate-x-0 translate-y-0 opacity-100' : HIDDEN[from],
        className,
      )}
    >
      {children}
    </div>
  );
}