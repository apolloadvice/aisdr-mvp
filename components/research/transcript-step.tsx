'use client';

import { useEffect, useState } from 'react';
import { FileText, BookOpen, ChevronDown } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useResearchStore } from '@/lib/store/research-store';
import { useICPStore } from '@/lib/store/icp-store';
import { EXAMPLE_CUSTOMER_INPUT } from '@/lib/constants';

function ICPPicker() {
  const icps = useICPStore((s) => s.icps);
  const loadICPs = useICPStore((s) => s.loadICPs);
  const isLoading = useICPStore((s) => s.isLoading);
  const setTranscript = useResearchStore((s) => s.setTranscript);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadICPs();
  }, [loadICPs]);

  if (icps.length === 0 && !isLoading) return null;

  const handleSelect = (savedIcp: (typeof icps)[number]) => {
    setTranscript(savedIcp.icp.description);
    useResearchStore.setState({
      icp: savedIcp.icp,
      step: 'review',
      strategyMessages: []
    });
    // Save session with loaded ICP then generate strategy
    useResearchStore.getState().saveSession();
    useResearchStore.getState().generateStrategy();
    setOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        className="text-muted-foreground"
      >
        <BookOpen className="size-3.5" />
        Load saved ICP
        <ChevronDown className={`size-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="border-border bg-card absolute bottom-full left-0 z-20 mb-1 w-full overflow-hidden rounded-lg border shadow-lg sm:w-72">
            {isLoading ? (
              <div className="text-muted-foreground px-4 py-3 text-xs">Loading...</div>
            ) : (
              icps.map((savedIcp) => (
                <button
                  key={savedIcp.id}
                  onClick={() => handleSelect(savedIcp)}
                  className="hover:bg-muted/50 w-full px-4 py-2.5 text-left transition-colors"
                >
                  <span className="block truncate text-sm font-medium">{savedIcp.name}</span>
                  <span className="text-muted-foreground block truncate text-xs">
                    {savedIcp.icp.description.slice(0, 80)}...
                  </span>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function TranscriptStep() {
  const transcript = useResearchStore((s) => s.transcript);
  const setTranscript = useResearchStore((s) => s.setTranscript);
  const isExtracting = useResearchStore((s) => s.isExtracting);
  const error = useResearchStore((s) => s.error);

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight">Describe your customer</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          The more details you provide, the better the results. Include who you sell to, what
          signals matter, and any example companies.
        </p>
      </div>

      {error && <p className="text-destructive mb-4 text-sm">{error}</p>}

      <div className="border-border bg-card overflow-hidden rounded-[var(--card-radius)] border">
        <div className="bg-muted/50 border-border flex items-center justify-between border-b px-4 py-2.5">
          <span className="text-muted-foreground section-label">Customer Profile</span>
          {transcript.trim() && (
            <span className="text-muted-foreground/60 text-xs">
              <kbd className="bg-muted rounded px-1 py-0.5 font-mono text-xs">Cmd+Enter</kbd> to
              continue
            </span>
          )}
        </div>

        <div className="p-4">
          <Textarea
            placeholder="Who is your ideal customer? Describe the industries, company size, job titles, technologies, buying signals, or anything else that defines a good fit..."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="min-h-52 resize-y border-none bg-transparent p-0 shadow-none focus-visible:ring-0"
            disabled={isExtracting}
          />
        </div>

        <div className="border-border flex flex-wrap items-center gap-2 border-t px-4 py-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTranscript(EXAMPLE_CUSTOMER_INPUT)}
            className="text-muted-foreground"
          >
            <FileText className="size-3.5" />
            Try an example
          </Button>
          <ICPPicker />
        </div>
      </div>
    </>
  );
}
