'use client';

import { useEffect, useRef } from 'react';
import { Loader2, Check } from 'lucide-react';
import { useResearchStore } from '@/lib/store/research-store';
import { TranscriptStep } from './transcript-step';
import { StrategyStep } from './strategy-step';
import { ConfirmStep } from './confirm-step';
import { ResultsStep } from './results-step';
import { BottomNav } from './bottom-nav';
import { EmailEditorPanel } from './email-editor-panel.client';
import type { ResearchSession } from '@/lib/types';

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

const VALID_STEPS = new Set(['input', 'review', 'confirm', 'results']);

function toStep(value: string): 'input' | 'review' | 'confirm' | 'results' {
  return VALID_STEPS.has(value) ? (value as 'input' | 'review' | 'confirm' | 'results') : 'input';
}

/** Hydrate store synchronously from server-fetched session data */
function hydrateStore(session: ResearchSession) {
  const state = useResearchStore.getState();
  // Only hydrate if we haven't already (or if switching sessions)
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
    lastSavedAt: session.updated_at,
    error: null
  });
}

export function ResearchDashboard({ session }: { session: ResearchSession }) {
  // Hydrate before first render — no flash
  hydrateStore(session);

  const step = useResearchStore((s) => s.step);
  const icp = useResearchStore((s) => s.icp);
  const transcript = useResearchStore((s) => s.transcript);
  const isExtracting = useResearchStore((s) => s.isExtracting);
  const isResearching = useResearchStore((s) => s.isResearching);
  const selectedCompanies = useResearchStore((s) => s.selectedCompanies);
  const composeParams = useResearchStore((s) => s.composeParams);

  const extractICP = useResearchStore((s) => s.extractICP);
  const approveStrategy = useResearchStore((s) => s.approveStrategy);
  const isStrategizing = useResearchStore((s) => s.isStrategizing);
  const strategyMessages = useResearchStore((s) => s.strategyMessages);
  const research = useResearchStore((s) => s.research);
  const loadContactedCompanies = useResearchStore((s) => s.loadContactedCompanies);
  const sessionId = useResearchStore((s) => s.sessionId);
  const sessionName = useResearchStore((s) => s.sessionName);

  const initRef = useRef(false);

  // Load contacted companies on mount (async, doesn't affect initial render)
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    loadContactedCompanies();
  }, [loadContactedCompanies]);

  // Cmd+Enter / Ctrl+Enter to advance
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
    <div className="bg-background min-h-screen">
      <main className="mx-auto max-w-7xl px-6 pt-10 pb-24">
        {sessionId && (
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-muted-foreground truncate text-sm font-medium">{sessionName}</h1>
            <SaveIndicator />
          </div>
        )}

        <div className="animate-in fade-in duration-300" key={step}>
          {step === 'input' && <TranscriptStep />}
          {step === 'review' && icp && <StrategyStep />}
          {step === 'confirm' && <ConfirmStep />}
          {step === 'results' && <ResultsStep />}
        </div>
      </main>

      <EmailEditorPanel
        open={composeParams !== null}
        params={composeParams}
        onClose={() => useResearchStore.getState().setComposeParams(null)}
      />

      <BottomNav />
    </div>
  );
}
