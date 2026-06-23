import * as React from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card text-card-foreground shadow-card transition-all duration-200',
        className,
      )}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 sm:p-6', className)} {...props} />;
}

/** 상단·중간·하단(버튼) 구조 — h-full + footer mt-auto */
export function PageCard({
  className,
  hover = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div
      className={cn(
        'flex h-full min-h-[280px] flex-col rounded-xl border border-border bg-card shadow-card transition-all duration-200',
        hover && 'hover:border-primary/30 hover:bg-card-hover hover:shadow-card-hover',
        className,
      )}
      {...props}
    />
  );
}

export function PageCardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 sm:p-6 pb-0 shrink-0', className)} {...props} />;
}

export function PageCardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex-1 p-4 sm:p-6 pt-3', className)} {...props} />;
}

export function PageCardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-auto p-4 sm:p-6 pt-0 shrink-0', className)} {...props} />;
}
