'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { useAuthStore } from '@/lib/store/auth-store';
import { useProfileStore } from '@/lib/store/profile-store';
import { createClient } from '@/lib/supabase/client';

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

function UserAvatar() {
  const [user, setUser] = useState<User | null>(null);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const openProfile = useProfileStore((s) => s.openProfile);

  const configured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabase = configured ? createClient() : null;

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  if (!user) {
    return (
      <Button variant="ghost" size="sm" onClick={openAuthModal}>
        Sign in
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => openProfile()}
      className="hover:ring-primary/30 rounded-full transition-all hover:ring-2"
    >
      {user.user_metadata?.avatar_url ? (
        <img
          src={user.user_metadata.avatar_url}
          alt=""
          className="size-7 rounded-full"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-full text-xs font-medium">
          {(user.email?.[0] ?? '?').toUpperCase()}
        </div>
      )}
    </button>
  );
}

function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="md:hidden">
      <Button variant="ghost" size="icon-sm" onClick={() => setOpen(true)}>
        <Menu className="size-5" />
        <span className="sr-only">Open menu</span>
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" size="sm">
          <SheetHeader>
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription className="sr-only">Site navigation links</SheetDescription>
          </SheetHeader>
          <nav className="flex flex-col gap-1 px-4">
            <Link
              href="/research"
              className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                pathname.startsWith('/research')
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              Research
            </Link>
            <Link
              href="/emails"
              className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                pathname.startsWith('/emails')
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              Emails
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function Header() {
  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        backgroundColor: 'var(--header-bg, hsl(var(--card)))',
        borderColor: 'var(--header-border, hsl(var(--border)))',
        backdropFilter: 'var(--header-backdrop, none)'
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <SignalMark className="text-primary" />
            <span className="text-foreground text-sm font-semibold tracking-widest uppercase">
              Signal
            </span>
            <span className="bg-primary/15 text-primary rounded-sm px-1.5 py-0.5 text-[10px] leading-none font-medium tracking-wide uppercase">
              Beta
            </span>
          </Link>
          <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
            <Link href="/research">Research</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
            <Link href="/emails">Emails</Link>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <UserAvatar />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
