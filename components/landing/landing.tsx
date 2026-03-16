'use client';

import Link from 'next/link';
import { ArrowRight, Search, Users, Mail, Target, Zap, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STEPS = [
  { num: '01', icon: Search, label: 'Transcript in', desc: 'Paste a scoping call or ICP' },
  { num: '02', icon: Target, label: 'Signal scan', desc: 'AI finds matching companies' },
  { num: '03', icon: Users, label: 'Contacts pulled', desc: 'Decision makers + emails' },
  { num: '04', icon: Mail, label: 'Outreach drafted', desc: 'Personalized hooks, ready to send' }
];

const FEATURES = [
  { icon: Zap, label: 'Real buying signals', desc: 'Job postings, funding, tech changes' },
  { icon: BarChart3, label: 'AI-ranked leads', desc: 'Best ICP fit surfaced first' },
  { icon: Target, label: 'Decision makers', desc: 'VP+, C-suite, budget holders' }
];

export function Landing() {
  return (
    <div className="flex h-[calc(100vh-49px)] flex-col">
      {/* Feature strip — right below header */}
      <div className="border-border bg-card/60 border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-8 px-6 py-2.5">
          {FEATURES.map((f, i) => (
            <div key={f.label} className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <f.icon className="text-primary size-3.5" />
                <span className="text-xs font-medium">{f.label}</span>
                <span className="text-muted-foreground text-xs">{f.desc}</span>
              </div>
              {i < FEATURES.length - 1 && <div className="bg-border h-3 w-px" />}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center gap-16 px-6 py-10">
        {/* Hero */}
        <div className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-700">
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Catch the signal.
            <br />
            <span className="text-primary">Close the deal.</span>
          </h1>
          <p className="text-muted-foreground mt-4 max-w-lg text-sm leading-relaxed sm:text-base">
            AI-powered outbound research that monitors buying signals, identifies decision makers,
            and drafts personalized outreach — in minutes.
          </p>
          <Button asChild size="lg" className="mt-6 gap-2">
            <Link href="/research">
              Start researching
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        {/* Pipeline */}
        <div
          className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-700"
          style={{ animationDelay: '200ms' }}
        >
          <div className="border-border bg-card overflow-hidden rounded-lg border">
            <div className="border-border flex items-center gap-2 border-b px-4 py-2">
              <div className="bg-primary/20 size-2 rounded-full" />
              <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Pipeline
              </span>
            </div>
            <div className="grid grid-cols-4">
              {STEPS.map((step, i) => (
                <div
                  key={step.num}
                  className={`relative px-4 py-4 ${i < 3 ? 'border-border border-r' : ''}`}
                >
                  <div className="text-muted-foreground/25 mb-2 font-mono text-xs font-bold">
                    {step.num}
                  </div>
                  <step.icon className="text-primary mb-2 size-4" />
                  <div className="text-xs font-semibold">{step.label}</div>
                  <div className="text-muted-foreground mt-0.5 text-xs">{step.desc}</div>
                  {i < 3 && (
                    <div className="text-border absolute top-1/2 -right-2 z-10 -translate-y-1/2">
                      <ArrowRight className="size-3.5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
