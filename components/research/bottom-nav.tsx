'use client';

import { Loader2, ChevronRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Step = 'input' | 'review' | 'results';

export function BottomNav({
  step,
  setStep,
  isExtracting,
  isLoading,
  hasIcp,
  hasResults,
  transcript,
  icpDescription,
  onExtractICP,
  onRunResearch,
  onStartOver,
  onSkip
}: {
  step: Step;
  setStep: (s: Step) => void;
  isExtracting: boolean;
  isLoading: boolean;
  hasIcp: boolean;
  hasResults: boolean;
  transcript: string;
  icpDescription: string;
  onExtractICP: () => void;
  onRunResearch: () => void;
  onStartOver: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="border-border bg-card/80 fixed right-0 bottom-0 left-0 border-t backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* Left: clickable step navigation */}
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setStep('input')}
            className={`rounded-md px-2.5 py-1.5 transition-colors ${
              step === 'input'
                ? 'bg-muted text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            1. Transcript
          </button>
          <span className="text-border">&mdash;</span>
          <button
            onClick={() => hasIcp && setStep('review')}
            disabled={!hasIcp}
            className={`rounded-md px-2.5 py-1.5 transition-colors ${
              step === 'review'
                ? 'bg-muted text-foreground font-medium'
                : hasIcp
                  ? 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  : 'text-muted-foreground/50 cursor-not-allowed'
            }`}
          >
            2. Review ICP
          </button>
          <span className="text-border">&mdash;</span>
          <button
            onClick={() => (hasResults || isLoading) && setStep('results')}
            disabled={!hasResults && !isLoading}
            className={`rounded-md px-2.5 py-1.5 transition-colors ${
              step === 'results'
                ? 'bg-muted text-foreground font-medium'
                : hasResults || isLoading
                  ? 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  : 'text-muted-foreground/50 cursor-not-allowed'
            }`}
          >
            3. Results
          </button>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2">
          {isLoading && step !== 'results' && (
            <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Loader2 className="size-3 animate-spin" />
              Researching...
            </span>
          )}

          {step === 'input' && (
            <>
              <Button size="sm" variant="ghost" onClick={onSkip}>
                Skip
                <ChevronRight className="size-4" />
              </Button>
              <Button
                size="sm"
                onClick={onExtractICP}
                disabled={isExtracting || !transcript.trim()}
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    Extract ICP
                    <ChevronRight className="size-4" />
                  </>
                )}
              </Button>
            </>
          )}

          {step === 'review' && (
            <Button
              size="sm"
              onClick={onRunResearch}
              disabled={isLoading || !icpDescription.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Researching...
                </>
              ) : (
                <>
                  Run Research
                  <ChevronRight className="size-4" />
                </>
              )}
            </Button>
          )}

          {step === 'results' && (
            <>
              {isLoading && (
                <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <Loader2 className="size-3.5 animate-spin" />
                  Researching...
                </span>
              )}
              <Button size="sm" variant="outline" onClick={onStartOver}>
                <RotateCcw className="size-3.5" />
                New Research
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
