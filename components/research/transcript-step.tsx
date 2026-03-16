'use client';

import { FileText } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const EXAMPLE_TRANSCRIPT = `We sell GPU scheduling and orchestration software for ML teams. Our ideal customer is an AI-intensive startup that's scaling past the point where manual GPU management works. They've typically raised $30M+ and are hiring for MLOps, ML Platform, or GPU infrastructure roles. Key signals we look for are job postings mentioning Kubernetes GPU scheduling, distributed training, or compute cost optimization. Companies like Modal, Anyscale, and Replicate are good examples of the type of company we sell to, though they're also competitors in some ways. We mainly target VP of Infrastructure, Head of ML Platform, or CTO as the buyer.`;

export function TranscriptStep({
  transcript,
  setTranscript,
  isExtracting,
  error
}: {
  transcript: string;
  setTranscript: (v: string) => void;
  isExtracting: boolean;
  error: string | null;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-semibold tracking-tight">Paste your scoping call</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Drop in a call transcript, meeting notes, or describe your ICP. We&apos;ll extract the
          targeting criteria, find matching companies, and draft personalized outreach.
        </p>
      </div>

      <div className="space-y-3">
        <Textarea
          placeholder="Paste your scoping call transcript, meeting notes, or describe your ideal customer..."
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          className="min-h-52 resize-y"
          disabled={isExtracting}
        />

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTranscript(EXAMPLE_TRANSCRIPT)}
            className="text-muted-foreground"
          >
            <FileText className="size-3.5" />
            Try an example
          </Button>
          {transcript.trim() && (
            <span className="text-muted-foreground/60 text-xs">
              Press <kbd className="bg-muted rounded px-1 py-0.5 font-mono text-xs">Cmd+Enter</kbd>{' '}
              to continue
            </span>
          )}
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}
      </div>
    </div>
  );
}
