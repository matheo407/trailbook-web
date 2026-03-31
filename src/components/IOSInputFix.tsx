'use client';

import { useEffect } from 'react';

// iOS PWA standalone mode bug: inputs/textareas don't receive focus
// on tap. Fix: listen for touchend and explicitly call .focus().
export default function IOSInputFix() {
  useEffect(() => {
    const handler = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        e.preventDefault();
        target.focus();
      }
    };
    document.addEventListener('touchend', handler, { passive: false });
    return () => document.removeEventListener('touchend', handler);
  }, []);

  return null;
}
