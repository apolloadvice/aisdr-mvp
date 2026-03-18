'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, Radio, UserCheck, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/auth-store';
import { createClient } from '@/lib/supabase/client';

const STEPS = [
  {
    num: '01',
    icon: Radio,
    title: 'Detect signals',
    desc: 'Job postings, funding rounds, hiring surges — captured in real time.',
    accent: 'accent-primary'
  },
  {
    num: '02',
    icon: UserCheck,
    title: 'Find decision makers',
    desc: 'The right person with verified contact info, ready to go.',
    accent: 'accent-secondary'
  },
  {
    num: '03',
    icon: Pencil,
    title: 'Draft outreach',
    desc: 'Personalized emails rooted in the exact signal detected.',
    accent: 'accent-tertiary'
  }
];

export function Landing() {
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const router = useRouter();

  const handleGetStarted = () => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.push('/research');
      } else {
        openAuthModal();
      }
    });
  };

  return (
    <div className="relative flex min-h-[calc(100vh-49px)] flex-col overflow-hidden">
      {/* Subtle dot background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }}
      />

      {/* Accent glow — top right */}
      <div
        className="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full opacity-[0.04]"
        style={{
          background: 'radial-gradient(circle, oklch(var(--accent-primary)), transparent 70%)'
        }}
      />

      <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-6">
        {/* ── Hero + Stats ── */}
        <section className="flex flex-1 flex-col justify-center pt-16 pb-8 sm:pt-24 sm:pb-12">
          <div
            className="animate-in fade-in fill-mode-both duration-500"
            style={{ animationDelay: '0ms' }}
          >
            <span className="section-label text-muted-foreground">AI-Powered Outbound</span>
          </div>

          <div
            className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both mt-5 duration-700"
            style={{ animationDelay: '100ms' }}
          >
            <h1 className="text-foreground max-w-3xl text-4xl leading-[1.08] font-bold tracking-tight sm:text-5xl lg:text-6xl">
              The best time to reach out is <span className="text-primary">right now</span>
            </h1>
          </div>

          <div
            className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both mt-5 duration-700 sm:mt-6"
            style={{ animationDelay: '200ms' }}
          >
            <p className="text-muted-foreground max-w-lg text-base leading-relaxed sm:text-lg">
              Signal monitors the web for buying signals and turns them into personalized outreach —
              automatically.
            </p>
          </div>

          <div
            className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both mt-7 flex items-center gap-4 duration-700 sm:mt-8"
            style={{ animationDelay: '300ms' }}
          >
            <Button size="lg" className="gap-2 px-6" onClick={handleGetStarted}>
              Get started
              <ArrowRight className="size-4" />
            </Button>
            <span className="text-muted-foreground text-xs">No credit card required</span>
          </div>
        </section>

        {/* ── How it works ── */}
        <section
          className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both border-border border-t py-10 duration-700 sm:py-14"
          style={{ animationDelay: '500ms' }}
        >
          <div className="mb-8 flex items-end justify-between sm:mb-10">
            <div>
              <span className="section-label text-muted-foreground">How it works</span>
              <h2 className="text-foreground mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Three steps to pipeline
              </h2>
            </div>
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={handleGetStarted}>
              Start for free
              <ArrowRight className="size-3.5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
            {STEPS.map((step) => (
              <div
                key={step.title}
                className="bg-card group rounded-lg border p-5 transition-shadow duration-300"
                style={{ boxShadow: 'var(--card-shadow, none)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    'var(--card-hover-shadow, var(--shadow-md, 0 4px 12px rgba(0,0,0,.08)))';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--card-shadow, none)';
                }}
              >
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className="flex size-8 items-center justify-center rounded-md"
                    style={{ backgroundColor: `oklch(var(--${step.accent}) / 0.1)` }}
                  >
                    <step.icon
                      className="size-4"
                      style={{ color: `oklch(var(--${step.accent}))` }}
                    />
                  </div>
                  <span className="text-muted-foreground font-mono text-xs">{step.num}</span>
                </div>
                <h3 className="text-foreground text-sm font-semibold">{step.title}</h3>
                <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-border border-t py-6">
          <p className="text-muted-foreground text-xs">&copy; {new Date().getFullYear()} Signal</p>
        </footer>
      </div>
    </div>
  );
}
