'use client';

import { useState, useRef, useCallback } from 'react';
import { TranscriptStep } from './transcript-step';
import { ReviewStep } from './review-step';
import { ResultsStep } from './results-step';
import { BottomNav } from './bottom-nav';
import type { CompanyResult, ICPCriteria, ResearchStreamEvent } from '@/lib/types';

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

async function readSSEStream(
  response: Response,
  onEvent: (event: ResearchStreamEvent) => void | 'stop'
) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response stream');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const event: ResearchStreamEvent = JSON.parse(line.slice(6));
        const result = onEvent(event);
        if (result === 'stop') {
          reader.cancel();
          return;
        }
      } catch {
        // skip malformed events
      }
    }
  }
}

export function ResearchDashboard() {
  const [step, setStep] = useState<Step>('input');
  const [transcript, setTranscript] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [icp, setIcp] = useState<ICPCriteria | null>(null);
  const [results, setResults] = useState<CompanyResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleExtractICP = useCallback(async () => {
    if (!transcript.trim() || isExtracting) return;

    setIsExtracting(true);
    setError(null);

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcript.trim() })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Request failed: ${response.status}`);
      }

      await readSSEStream(response, (event) => {
        if (event.type === 'icp') {
          setIcp(event.data);
          setStep('review');
          return 'stop';
        }
        if (event.type === 'error') throw new Error(event.message);
      });
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
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ icp }),
        signal: abortRef.current.signal
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Request failed: ${response.status}`);
      }

      await readSSEStream(response, (event) => {
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
          case 'error':
            setError(event.message);
            break;
        }
      });
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

  return (
    <div className="bg-background min-h-screen">
      <main className="mx-auto max-w-7xl px-6 pt-10 pb-24">
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
          />
        )}
      </main>

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
