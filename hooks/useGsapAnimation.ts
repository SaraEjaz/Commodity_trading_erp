'use client';

import { useEffect, useRef } from 'react';
import { animations } from '@/lib/animations';

export function useGsapAnimation(animationType: keyof typeof animations, options?: any) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current && animationType in animations) {
      const animation = animations[animationType] as any;
      if (typeof animation === 'function') {
        animation(ref.current, options?.delay || options);
      }
    }
  }, [animationType, options]);

  return ref;
}

export function useGsapStagger(elementSelector: string, staggerDelay = 0.1) {
  useEffect(() => {
    const elements = document.querySelectorAll(elementSelector) as any as HTMLElement[];
    if (elements.length > 0) {
      animations.staggerCards(Array.from(elements), staggerDelay);
    }
  }, [elementSelector, staggerDelay]);
}

export function useGsapCounter(endValue: number, duration = 1) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current) {
      animations.counterAnimation(ref.current, endValue, duration);
    }
  }, [endValue, duration]);

  return ref;
}
