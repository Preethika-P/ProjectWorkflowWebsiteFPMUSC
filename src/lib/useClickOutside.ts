import { useEffect, useRef } from 'react';

export function useClickOutside<T extends HTMLElement>(
  onOutsideClick: () => void,
  isActive = true
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;

      if (target && ref.current?.contains(target)) {
        return;
      }

      onOutsideClick();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isActive, onOutsideClick]);

  return ref;
}
