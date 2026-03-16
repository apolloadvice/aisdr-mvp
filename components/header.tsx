'use client';

import { Zap } from 'lucide-react';
import { ThemeSettings } from '@/components/theme-settings';

export function Header() {
  return (
    <header className="border-border bg-card border-b">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary flex size-8 items-center justify-center rounded-lg">
            <Zap className="text-primary-foreground size-4" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">Signal</h1>
        </div>
        <ThemeSettings />
      </div>
    </header>
  );
}
