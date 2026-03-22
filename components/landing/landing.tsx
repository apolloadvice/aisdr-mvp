'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, Radar, Users, Send, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { useAuthStore } from '@/lib/store/auth-store';
import { MAX_WIDTH } from '@/lib/layout';

const STEPS = [
  {
    num: '01',
    icon: Radar,
    title: 'Detect signals',
    desc: 'Job postings, funding rounds, hiring surges — captured in real time.',
    gradient: 'linear-gradient(135deg, #6366f1, #7c3aed)'
  },
  {
    num: '02',
    icon: Users,
    title: 'Find decision makers',
    desc: 'The right person with verified contact info, ready to go.',
    gradient: 'linear-gradient(135deg, #7c3aed, #a855f7)'
  },
  {
    num: '03',
    icon: Send,
    title: 'Draft outreach',
    desc: 'Personalized emails rooted in the exact signal detected.',
    gradient: 'linear-gradient(135deg, #a855f7, #d946ef)'
  }
];

const SHOWCASE = [
  {
    label: 'Signal Detection',
    title: 'Catch buying signals before your competitors',
    desc: 'Remes monitors job postings, funding rounds, and product launches across the web — surfacing the companies most likely to buy right now.',
    image: '/showcase-signals.png'
  },
  {
    label: 'Contact Discovery',
    title: 'Find the right person instantly',
    desc: 'Automatically match signals to decision-makers with verified emails and LinkedIn profiles. No more guessing who to reach out to.',
    image: '/showcase-contacts.png'
  },
  {
    label: 'AI Outreach',
    title: 'Emails that actually get replies',
    desc: 'Every email is grounded in the signal that triggered it — relevant, timely, and personal. Not another generic template.',
    image: '/showcase-outreach.png'
  }
];

const FAQS = [
  {
    q: 'What is Remes and how does it work?',
    a: 'Remes is an AI-powered platform that detects real-time buying signals — hiring surges, funding rounds, leadership changes, product launches — and uses them to craft deeply personalized outreach to your ideal customers. You describe your ideal customer, and Remes finds, researches, and engages them automatically.'
  },
  {
    q: 'How is Remes different from other outreach tools?',
    a: 'Most tools automate sending. Remes automates research. We detect real-time buying signals and use them to write emails that reference things happening at the prospect\'s company right now. The difference is an email that says "congrats on your funding" vs. one that knows you raised $8M from Craft to scale your GTM team.'
  },
  {
    q: 'What reply rate can I expect?',
    a: 'Reply rates vary by industry and offer, but our signal-driven approach consistently outperforms generic outreach by 3–5x. Most customers see meaningful pipeline activity by week 6.'
  },
  {
    q: 'How much does Remes cost compared to hiring?',
    a: 'Plans start at $1,497/month. A fully loaded sales hire costs $90K–$150K/year, takes 3–6 months to ramp, and turns over at 39% annually. Remes starts producing pipeline in 2 weeks and never quits. One closed deal typically pays for the entire annual subscription.'
  },
  {
    q: 'What are buying signals?',
    a: 'Buying signals are real-time indicators that a company is ready to buy — things like hiring surges, funding rounds, leadership changes, product launches, headcount growth, and LinkedIn activity from key decision-makers. Remes detects these automatically so you can reach prospects at the perfect moment.'
  },
  {
    q: 'What types of buying signals does Remes detect?',
    a: 'Anything you can describe. Typical buying signals include hiring surges, specific role postings, funding rounds, leadership changes and new executive hires, product launches and company announcements, headcount growth velocity, LinkedIn posts and engagement from key decision-makers, tech stack changes, and competitive movements. You are not limited to these categories. You can describe what buying intent looks like for your product and Remes will find it.'
  },
  {
    q: 'Do you send emails from my account?',
    a: 'Yes. Remes sends through your connected email account via official APIs. Emails appear in your Sent folder, replies come to your inbox, and everything threads naturally. Your prospects never know a tool was involved.'
  },
  {
    q: 'How does Remes handle email deliverability?',
    a: 'Remes handles the full deliverability stack: dedicated domains, automated mailbox warmup (typically 2-3 weeks for new mailboxes), reputation monitoring, and sending controls, so you land in the primary inbox, not spam.'
  },
  {
    q: 'How is Remes different from ZoomInfo, Apollo, Instantly or Clay?',
    a: 'Apollo and ZoomInfo are contact databases: they find leads but do not research or write outreach. Instantly is a campaign tool: you have to import a lead list and manually create a campaign. Clay requires building automations from scratch with a credit system that burns fast. Remes replaces Clay + Apollo + Instantly with one tool: buying signal monitoring, lead research, personalized outreach, and deliverability, all built in.'
  },
  {
    q: 'Why is it called Remes?',
    a: "It's a reference to Hermes, the Greek god of commerce, trade, and messengers. He was the original messenger who always knew where to go, who to talk to, and exactly what to say. Fast forward to today, and the best sign that your outreach actually worked? Those two little letters in your inbox: RE:. Remes."
  }
];

export function Landing() {
  const user = useAuthStore((s) => s.user);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const router = useRouter();

  const handleGetStarted = () => {
    if (user) {
      router.push('/research');
    } else {
      openAuthModal();
    }
  };

  return (
    <div className="relative flex flex-col overflow-hidden">
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

      {/* ── Hero with gradient background ── */}
      <section
        className="relative min-h-[90dvh] overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 30%, #a855f7 65%, #d946ef 100%)'
        }}
      >
        <div
          className="pointer-events-none absolute right-0 bottom-0 left-0 h-[60%]"
          style={{
            background: 'linear-gradient(to bottom, transparent, var(--background))'
          }}
        />

        <div
          className={`relative mx-auto flex w-full ${MAX_WIDTH} flex-col items-center px-6 pt-28 pb-24 text-center sm:pt-40 sm:pb-32`}
        >
          <div
            className="animate-in fade-in fill-mode-both duration-500"
            style={{ animationDelay: '0ms' }}
          >
            <span className="section-label text-white/70">AI-Powered Outbound</span>
          </div>

          <div
            className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both mt-5 duration-700"
            style={{ animationDelay: '100ms' }}
          >
            <h1 className="max-w-3xl text-4xl leading-[1.08] font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              The best time to reach out is{' '}
              <span className="text-white/90 underline decoration-white/30 underline-offset-4">
                right now
              </span>
            </h1>
          </div>

          <div
            className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both mt-5 duration-700 sm:mt-6"
            style={{ animationDelay: '200ms' }}
          >
            <p className="mx-auto max-w-lg text-base leading-relaxed text-white/80 sm:text-lg">
              Remes monitors the web for buying signals and turns them into personalized outreach —
              automatically.
            </p>
          </div>

          <div
            className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both mt-7 flex items-center gap-4 duration-700 sm:mt-8"
            style={{ animationDelay: '300ms' }}
          >
            <Button
              size="lg"
              className="gap-2 border-white/20 bg-white px-6 text-[#7c3aed] hover:bg-white/90"
              onClick={handleGetStarted}
            >
              Get started
              <ArrowRight className="size-4" />
            </Button>
            <span className="text-xs text-white/60">No credit card required</span>
          </div>
        </div>
      </section>

      <div className={`relative mx-auto flex w-full ${MAX_WIDTH} flex-col px-6`}>
        {/* ── How it works ── */}
        <section
          className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both py-10 duration-700 sm:py-14"
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
                className="bg-card group rounded-xl border p-6 transition-all duration-300 hover:-translate-y-0.5"
                style={{ boxShadow: 'var(--card-shadow, none)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    'var(--card-hover-shadow, var(--shadow-md, 0 4px 12px rgba(0,0,0,.08)))';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--card-shadow, none)';
                }}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div
                    className="flex size-11 items-center justify-center rounded-lg shadow-sm"
                    style={{ background: step.gradient }}
                  >
                    <step.icon className="size-5 text-white" />
                  </div>
                  <span className="text-muted-foreground/40 text-2xl font-bold">{step.num}</span>
                </div>
                <h3 className="text-foreground text-base font-semibold">{step.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Showcase ── */}
        <section id="use-cases" className="border-border scroll-mt-16 border-t py-10 sm:py-14">
          <div className="mb-10 sm:mb-14">
            <span className="section-label text-muted-foreground">See it in action</span>
            <h2 className="text-foreground mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Built for modern sales teams
            </h2>
          </div>

          <div className="flex flex-col gap-16 sm:gap-20">
            {SHOWCASE.map((item, i) => (
              <div
                key={item.title}
                className={`flex flex-col items-center gap-8 sm:gap-12 ${i % 2 === 1 ? 'sm:flex-row-reverse' : 'sm:flex-row'}`}
              >
                {/* Text */}
                <div className="flex-1">
                  <span className="section-label text-primary">{item.label}</span>
                  <h3 className="text-foreground mt-2 text-xl font-bold tracking-tight sm:text-2xl">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground mt-3 max-w-md text-sm leading-relaxed sm:text-base">
                    {item.desc}
                  </p>
                </div>

                {/* Placeholder image/video */}
                <div className="bg-muted border-border flex aspect-video w-full flex-1 items-center justify-center overflow-hidden rounded-xl border">
                  <div className="flex flex-col items-center gap-2">
                    <div className="bg-primary/10 flex size-10 items-center justify-center rounded-full">
                      <Play className="text-primary size-4 translate-x-0.5" />
                    </div>
                    <span className="text-muted-foreground text-xs">{item.label}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQs ── */}
        <section id="faqs" className="border-border scroll-mt-16 border-t py-10 sm:py-14">
          <div className="mb-8 sm:mb-10">
            <span className="section-label text-muted-foreground">FAQs</span>
            <h2 className="text-foreground mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Frequently asked questions
            </h2>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* ── CTA ── */}
        <section className="border-border border-t py-14 text-center sm:py-20">
          <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
            Ready to fill your pipeline?
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-md text-sm leading-relaxed sm:text-base">
            Start detecting signals and generating outreach in minutes. No credit card required.
          </p>
          <Button size="lg" className="mt-7 gap-2 px-8" onClick={handleGetStarted}>
            Get started free
            <ArrowRight className="size-4" />
          </Button>
        </section>

        {/* ── Footer ── */}
        <footer className="border-border border-t py-6">
          <p className="text-muted-foreground text-xs">&copy; {new Date().getFullYear()} Remes</p>
        </footer>
      </div>
    </div>
  );
}
