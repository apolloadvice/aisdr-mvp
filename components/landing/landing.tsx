'use client';

import Link from 'next/link';
import { ArrowRight, Radio, UserCheck, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const STEPS = [
  {
    icon: Radio,
    title: 'Detect signals',
    desc: 'Job postings, funding rounds, hiring surges, tech stack changes.'
  },
  {
    icon: UserCheck,
    title: 'Find decision makers',
    desc: 'The right person at the right company, with verified contact info.'
  },
  {
    icon: Pencil,
    title: 'Draft outreach',
    desc: 'Personalized emails rooted in the exact signal detected.'
  }
];

export function Landing() {
  return (
    <div className="mx-auto max-w-7xl px-6 pt-24 pb-20 sm:pt-32">
      {/* Hero */}
      <Card className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500">
        <CardContent className="p-8 sm:p-12">
          <p className="text-muted-foreground mb-4 text-sm font-medium tracking-wide uppercase">
            AI-powered outbound
          </p>
          <h1 className="text-foreground max-w-xl text-4xl leading-[1.1] font-bold tracking-tight sm:text-5xl lg:text-6xl">
            The best time to reach out is right now
          </h1>
          <p className="text-muted-foreground mt-5 max-w-md text-base leading-relaxed">
            Signal monitors the web for buying signals and turns them into personalized outreach,
            automatically.
          </p>
          <Button asChild size="lg" className="mt-8 gap-2">
            <Link href="/research">
              Get started
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* How it works */}
      <div
        className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both mt-6 duration-700"
        style={{ animationDelay: '200ms' }}
      >
        <p className="text-muted-foreground mb-4 text-xs font-medium tracking-wider uppercase">
          How it works
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <Card key={step.title}>
              <CardContent className="p-6">
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-muted-foreground/30 font-mono text-xs font-bold">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <step.icon className="text-primary size-4" />
                </div>
                <h3 className="text-sm font-semibold">{step.title}</h3>
                <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{step.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
