import * as React from 'react';

import { cn } from '@/lib/utils';

function Card({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<'div'> & { size?: 'default' | 'sm' }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        'group/card bg-card text-card-foreground flex flex-col gap-[var(--density-card-gap)] overflow-hidden rounded-[var(--card-radius)] py-[var(--density-card-py)] text-sm shadow-xs has-[>img:first-child]:pt-0 data-[size=sm]:gap-[calc(var(--density-card-gap)*0.67)] data-[size=sm]:py-[calc(var(--density-card-py)*0.67)] *:[img:first-child]:rounded-t-[var(--card-radius)] *:[img:last-child]:rounded-b-[var(--card-radius)]',
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        'group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-[var(--card-radius)] px-[var(--density-card-px)] group-data-[size=sm]/card:px-[calc(var(--density-card-px)*0.67)] has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-[var(--density-card-py)] group-data-[size=sm]/card:[.border-b]:pb-[calc(var(--density-card-py)*0.67)]',
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        'text-base leading-normal font-medium group-data-[size=sm]/card:text-sm',
        className
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn(
        'px-[var(--density-card-px)] group-data-[size=sm]/card:px-[calc(var(--density-card-px)*0.67)]',
        className
      )}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        'flex items-center rounded-b-[var(--card-radius)] px-[var(--density-card-px)] group-data-[size=sm]/card:px-[calc(var(--density-card-px)*0.67)] [.border-t]:pt-[var(--density-card-py)] group-data-[size=sm]/card:[.border-t]:pt-[calc(var(--density-card-py)*0.67)]',
        className
      )}
      {...props}
    />
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
