'use client';

import { ThemeSettings } from '@/components/theme-settings';

function SignalMark({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="9" cy="9" r="9" fill="currentColor" />
      <circle cx="9" cy="9" r="4" fill="white" />
    </svg>
  );
}

export function Header() {
  return (
    <header className="border-border bg-card border-b">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2.5">
          <SignalMark className="text-primary" />
          <span className="text-foreground text-sm font-semibold tracking-widest uppercase">
            Signal
          </span>
          <span className="bg-primary/15 text-primary rounded-sm px-1.5 py-0.5 text-[10px] leading-none font-medium tracking-wide uppercase">
            Beta
          </span>
        </div>
        <ThemeSettings />
      </div>
    </header>
  );
}
