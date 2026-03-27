import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FlowChartProps {
  children: ReactNode;
  className?: string;
}

export function FlowChart({ children, className }: FlowChartProps) {
  return (
    <div className={cn(
      'flex items-center gap-0 overflow-x-auto pt-16 pb-8',
      'pr-12', // Only right padding, left padding handled by first child margin
      'scroll-smooth',
      '[&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-primary/20 [&::-webkit-scrollbar-thumb]:rounded-full',
      '[&>div:first-child]:ml-20', // Add left margin to first child to account for badge
      className
    )}>
      {children}
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
