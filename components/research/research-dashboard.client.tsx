'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { TranscriptStep } from './transcript-step';
import { ReviewStep } from './review-step';
import { ResultsStep } from './results-step';
import { BottomNav } from './bottom-nav';
import { EmailEditorPanel } from './email-editor-panel.client';
import { parseICP, runResearch } from '@/lib/api';
import type { CompanyResult, ComposeEmailParams, ICPCriteria } from '@/lib/types';

type Step = 'input' | 'review' | 'results';

const EMPTY_ICP: ICPCriteria = {
  description: '',
  industry_keywords: [],
  min_funding_amount: null,
  funding_stages: [],
  hiring_signals: [],
  tech_keywords: [],
  company_examples: []
};

export function ResearchDashboard() {
  const [step, setStep] = useState<Step>('input');
  const [transcript, setTranscript] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [icp, setIcp] = useState<ICPCriteria | null>(null);
  const [results, setResults] = useState<CompanyResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [composeParams, setComposeParams] = useState<ComposeEmailParams | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleExtractICP = useCallback(async () => {
    if (!transcript.trim() || isExtracting) return;

    setIsExtracting(true);
    setError(null);

    try {
      const data = await parseICP(transcript.trim());
      setIcp(data);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract ICP');
    } finally {
      setIsExtracting(false);
    }
  }, [transcript, isExtracting]);

  const handleRunResearch = useCallback(async () => {
    if (!icp || isLoading) return;

    setIsLoading(true);
    setStatusMessage('');
    setResults([]);
    setError(null);
    setStep('results');

    abortRef.current = new AbortController();

    try {
      await runResearch(
        icp,
        (event) => {
          switch (event.type) {
            case 'status':
              setStatusMessage(event.message);
              break;
            case 'company':
              setResults((prev) => [...prev, event.data]);
              break;
            case 'done':
              setStatusMessage(`Research complete. Found ${event.total} companies.`);
              break;
          }
        },
        abortRef.current.signal
      );
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, [icp, isLoading]);

  const handleStartOver = () => {
    setStep('input');
    setIcp(null);
    setResults([]);
    setError(null);
    setStatusMessage('');
  };

  // Cmd+Enter / Ctrl+Enter to advance
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (step === 'input' && transcript.trim() && !isExtracting) {
          handleExtractICP();
        } else if (step === 'review' && icp?.description?.trim() && !isLoading) {
          handleRunResearch();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [step, transcript, icp, isExtracting, isLoading, handleExtractICP, handleRunResearch]);

  return (
    <div className="bg-background min-h-screen">
      <main className="mx-auto max-w-7xl px-6 pt-10 pb-24">
        <div className="animate-in fade-in duration-300" key={step}>
          {step === 'input' && (
            <TranscriptStep
              transcript={transcript}
              setTranscript={setTranscript}
              isExtracting={isExtracting}
              error={error}
            />
          )}

          {step === 'review' && icp && (
            <ReviewStep icp={icp} setIcp={setIcp} error={error} setError={setError} />
          )}

          {step === 'results' && (
            <ResultsStep
              icp={icp}
              results={results}
              isLoading={isLoading}
              statusMessage={statusMessage}
              error={error}
              onComposeEmail={setComposeParams}
              onEditCriteria={() => setStep('review')}
            />
          )}
        </div>
      </main>

      <EmailEditorPanel
        open={composeParams !== null}
        params={composeParams}
        onClose={() => setComposeParams(null)}
      />

      <BottomNav
        step={step}
        setStep={setStep}
        isExtracting={isExtracting}
        isLoading={isLoading}
        hasIcp={!!icp}
        hasResults={results.length > 0}
        transcript={transcript}
        icpDescription={icp?.description ?? ''}
        onExtractICP={handleExtractICP}
        onRunResearch={handleRunResearch}
        onStartOver={handleStartOver}
        onSkip={() => {
          if (!icp) setIcp({ ...EMPTY_ICP });
          setStep('review');
        }}
      />
    </div>
  );
}
