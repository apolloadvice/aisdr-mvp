'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Loader2, Check, ChevronRight } from 'lucide-react';
import { useResearchStore } from '@/lib/store/research-store';
import { TranscriptStep } from './transcript-step';
import { StrategyStep } from './strategy-step';
import { ConfirmStep } from './confirm-step';
import { ResultsStep } from './results-step';
import { OutreachStep } from './outreach-step.client';
import { BottomNav } from './bottom-nav';
import type { ResearchSession } from '@/lib/types';
import { MAX_WIDTH } from '@/lib/layout';

function SaveIndicator() {
  const isSaving = useResearchStore((s) => s.isSaving);
  const lastSavedAt = useResearchStore((s) => s.lastSavedAt);
  const sessionId = useResearchStore((s) => s.sessionId);

  if (!sessionId) return null;

  return (
    <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
      {isSaving ? (
        <>
          <Loader2 className="size-3 animate-spin" />
          Saving...
        </>
      ) : lastSavedAt ? (
        <>
          <Check className="size-3" />
          Saved
        </>
      ) : null}
    </span>
  );
}

const VALID_STEPS = new Set(['input', 'review', 'confirm', 'results', 'outreach']);

function toStep(value: string): 'input' | 'review' | 'confirm' | 'results' | 'outreach' {
  return VALID_STEPS.has(value)
    ? (value as 'input' | 'review' | 'confirm' | 'results' | 'outreach')
    : 'input';
}

function hydrateStore(session: ResearchSession) {
  const state = useResearchStore.getState();
  if (state.sessionId === session.id) return;

  useResearchStore.setState({
    sessionId: session.id,
    sessionName: session.name,
    step: toStep(session.step || 'input'),
    transcript: session.transcript || '',
    icp: session.icp,
    strategyMessages: session.strategy_messages || [],
    candidates: session.candidates || [],
    selectedCompanies: session.selected_companies || [],
    results: session.results || [],
    peopleResults: session.people_results || {},
    emailSequences: session.email_sequences || {},
    lastSavedAt: session.updated_at,
    error: null
  });
}

export function ResearchDashboard({ session }: { session: ResearchSession }) {
  hydrateStore(session);

  const step = useResearchStore((s) => s.step);
  const icp = useResearchStore((s) => s.icp);
  const transcript = useResearchStore((s) => s.transcript);
  const isExtracting = useResearchStore((s) => s.isExtracting);
  const isResearching = useResearchStore((s) => s.isResearching);
  const selectedCompanies = useResearchStore((s) => s.selectedCompanies);
  const extractICP = useResearchStore((s) => s.extractICP);
  const approveStrategy = useResearchStore((s) => s.approveStrategy);
  const isStrategizing = useResearchStore((s) => s.isStrategizing);
  const strategyMessages = useResearchStore((s) => s.strategyMessages);
  const research = useResearchStore((s) => s.research);
  const loadContactedCompanies = useResearchStore((s) => s.loadContactedCompanies);
  const loadPreviouslyResearched = useResearchStore((s) => s.loadPreviouslyResearched);
  const sessionId = useResearchStore((s) => s.sessionId);
  const sessionName = useResearchStore((s) => s.sessionName);

  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    loadContactedCompanies();
    loadPreviouslyResearched();
  }, [loadContactedCompanies, loadPreviouslyResearched]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (step === 'input' && transcript.trim() && !isExtracting) {
          extractICP();
        } else if (step === 'review' && strategyMessages.length > 0 && !isStrategizing) {
          approveStrategy();
        } else if (step === 'confirm' && selectedCompanies.length > 0 && !isResearching) {
          research();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    step,
    transcript,
    strategyMessages,
    selectedCompanies,
    isExtracting,
    isStrategizing,
    isResearching,
    extractICP,
    approveStrategy,
    research
  ]);

  return (
    <div className="bg-background min-h-dvh">
      <main className={`mx-auto ${MAX_WIDTH} px-4 pt-10 pb-24 md:px-6`}>
        {sessionId && (
          <div className="mb-6 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="text-muted-foreground mb-1 flex items-center gap-1.5 text-sm">
                <Link href="/research" className="hover:text-foreground shrink-0 transition-colors">
                  Research
                </Link>
                <ChevronRight className="text-border size-3 shrink-0" />
              </div>
              <h1 className="text-foreground truncate text-2xl font-semibold tracking-tight">
                {sessionName}
              </h1>
            </div>
            <SaveIndicator />
          </div>
        )}

        <div className="animate-in fade-in duration-300" key={step}>
          {step === 'input' && <TranscriptStep />}
          {step === 'review' && icp && <StrategyStep />}
          {step === 'confirm' && <ConfirmStep />}
          {step === 'results' && <ResultsStep />}
          {step === 'outreach' && <OutreachStep />}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
