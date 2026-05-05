import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FlowChartProps {
  children: ReactNode;
  className?: string;
}

export function FlowChart({ children, className }: FlowChartProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({
    canScroll: false,
    canScrollLeft: false,
    canScrollRight: false,
  });

  const updateScrollState = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;

    const maxScrollLeft = element.scrollWidth - element.clientWidth;
    setScrollState({
      canScroll: maxScrollLeft > 1,
      canScrollLeft: element.scrollLeft > 1,
      canScrollRight: element.scrollLeft < maxScrollLeft - 1,
    });
  }, []);

  useEffect(() => {
    updateScrollState();
    window.addEventListener('resize', updateScrollState);

    return () => {
      window.removeEventListener('resize', updateScrollState);
    };
  }, [children, updateScrollState]);

  const scrollByPage = (direction: 'left' | 'right') => {
    const element = scrollRef.current;
    if (!element) return;

    element.scrollBy({
      left: element.clientWidth * 0.8 * (direction === 'left' ? -1 : 1),
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className={cn(
          'flex items-center gap-0 overflow-x-auto pt-16 pb-8',
          'pr-12', // Only right padding, left padding handled by first child margin
          'scroll-smooth',
          '[&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-primary/20 [&::-webkit-scrollbar-thumb]:rounded-full',
          '[&>div:first-child]:ml-20', // Add left margin to first child to account for badge
          className
        )}
      >
        {children}
      </div>

      {scrollState.canScroll && (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="absolute bottom-3 left-2 z-20 h-7 w-7 rounded-full border-slate-200 bg-white/95 p-0 text-primary shadow-md backdrop-blur hover:bg-primary hover:text-white disabled:opacity-35"
            onClick={() => scrollByPage('left')}
            disabled={!scrollState.canScrollLeft}
            aria-label="Scroll workflow left"
            title="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="absolute bottom-3 right-2 z-20 h-7 w-7 rounded-full border-slate-200 bg-white/95 p-0 text-primary shadow-md backdrop-blur hover:bg-primary hover:text-white disabled:opacity-35"
            onClick={() => scrollByPage('right')}
            disabled={!scrollState.canScrollRight}
            aria-label="Scroll workflow right"
            title="Scroll right"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </>
      )}
    </div>
  );
}

interface FlowNodeProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  isActive?: boolean;
}

export function FlowNode({ children, className, onClick, isActive }: FlowNodeProps) {
  return (
    <div
      className={cn(
        'relative flex-shrink-0',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface FlowLineProps {
  variant?: 'default' | 'accent';
  className?: string;
}

export function FlowLine({ variant = 'default', className }: FlowLineProps) {
  const stroke = variant === 'accent' ? '#FFCC00' : '#990000';

  return (
    <div className={cn('-mx-px flex items-center justify-center flex-shrink-0', className)}>
      <svg
        width="56"
        height="14"
        viewBox="0 0 56 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <path
          d="M0 7 H46"
          stroke={stroke}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path d="M46 2.5 L56 7 L46 11.5Z" fill={stroke} />
      </svg>
    </div>
  );
}
