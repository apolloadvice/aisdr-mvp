'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ChevronRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { useResearchStore } from '@/lib/store/research-store';

function NavButton({
  label,
  active,
  enabled,
  onClick
}: {
  label: string;
  active: boolean;
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={() => enabled && onClick()}
      disabled={!enabled}
      className={`rounded-md px-2.5 py-1.5 transition-colors ${
        active
          ? 'bg-muted text-foreground font-medium'
          : enabled
            ? 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            : 'text-muted-foreground/50 cursor-not-allowed'
      }`}
    >
      {label}
    </button>
  );
}

export function BottomNav() {
  const router = useRouter();
  const step = useResearchStore((s) => s.step);
  const setStep = useResearchStore((s) => s.setStep);
  const isExtracting = useResearchStore((s) => s.isExtracting);
  const isDiscovering = useResearchStore((s) => s.isDiscovering);
  const isResearching = useResearchStore((s) => s.isResearching);
  const icp = useResearchStore((s) => s.icp);
  const candidates = useResearchStore((s) => s.candidates);
  const results = useResearchStore((s) => s.results);
  const transcript = useResearchStore((s) => s.transcript);
  const selectedCompanies = useResearchStore((s) => s.selectedCompanies);

  const strategyMessages = useResearchStore((s) => s.strategyMessages);
  const isStrategizing = useResearchStore((s) => s.isStrategizing);

  const extractICP = useResearchStore((s) => s.extractICP);
  const approveStrategy = useResearchStore((s) => s.approveStrategy);
  const research = useResearchStore((s) => s.research);
  const startOver = useResearchStore((s) => s.startOver);
  const skipToReview = useResearchStore((s) => s.skipToReview);

  const hasIcp = !!icp;
  const hasCandidates = candidates.length > 0;
  const hasResults = results.length > 0;
  const selectedCount = selectedCompanies.length;

  return (
    <div
      className="fixed right-0 bottom-0 left-0 border-t"
      style={{
        backgroundColor: 'var(--bottom-nav-bg, hsl(var(--card) / 0.8))',
        borderColor: 'var(--bottom-nav-border, hsl(var(--border)))',
        backdropFilter: 'var(--bottom-nav-backdrop, blur(8px))'
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* Left: step navigation */}
        <div className="flex items-center gap-1 text-xs">
          <NavButton
            label="1. Describe"
            active={step === 'input'}
            enabled
            onClick={() => setStep('input')}
          />
          <span className="text-border">&mdash;</span>
          <NavButton
            label="2. Strategy"
            active={step === 'review'}
            enabled={hasIcp}
            onClick={() => setStep('review')}
          />
          <span className="text-border">&mdash;</span>
          <NavButton
            label="3. Companies"
            active={step === 'confirm'}
            enabled={hasCandidates || isDiscovering}
            onClick={() => setStep('confirm')}
          />
          <span className="text-border">&mdash;</span>
          <NavButton
            label="4. Results"
            active={step === 'results'}
            enabled={hasResults || isResearching}
            onClick={() => setStep('results')}
          />
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2">
          {(isDiscovering || isResearching) && step !== 'confirm' && step !== 'results' && (
            <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Loader2 className="size-3 animate-spin" />
              {isDiscovering ? 'Discovering...' : 'Researching...'}
            </span>
          )}

          {step === 'input' && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={skipToReview}
                title="Start with a blank profile"
              >
                Skip to Strategy
                <ChevronRight className="size-4" />
              </Button>
              <Button size="sm" onClick={extractICP} disabled={isExtracting || !transcript.trim()}>
                {isExtracting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Analyze
                    <ChevronRight className="size-4" />
                  </>
                )}
              </Button>
            </>
          )}

          {step === 'review' && (
            <>
              {isStrategizing && (
                <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <Loader2 className="size-3 animate-spin" />
                  Thinking...
                </span>
              )}
              <Button
                size="sm"
                onClick={approveStrategy}
                disabled={isStrategizing || strategyMessages.length === 0}
              >
                Find Companies
                <ChevronRight className="size-4" />
              </Button>
            </>
          )}

          {step === 'confirm' && (
            <>
              {isDiscovering && (
                <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <Loader2 className="size-3 animate-spin" />
                  Discovering...
                </span>
              )}
              <Button
                size="sm"
                onClick={research}
                disabled={isDiscovering || isResearching || selectedCount === 0}
              >
                {isResearching ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Researching...
                  </>
                ) : (
                  <>
                    Research {selectedCount} {selectedCount === 1 ? 'Company' : 'Companies'}
                    <ChevronRight className="size-4" />
                  </>
                )}
              </Button>
            </>
          )}

          {step === 'results' && (
            <>
              {isResearching && (
                <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <Loader2 className="size-3.5 animate-spin" />
                  Researching...
                </span>
              )}
              {hasResults ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <RotateCcw className="size-3.5" />
                      New Research
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Start new research?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Your current session is saved, but you&apos;ll leave this view.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          startOver();
                          router.push('/research');
                        }}
                      >
                        Start New
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    startOver();
                    router.push('/research');
                  }}
                >
                  <RotateCcw className="size-3.5" />
                  New Research
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
