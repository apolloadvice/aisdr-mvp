'use client';

import { useState, useCallback } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TagEditor } from './tag-editor';
import { parseICP } from '@/lib/api';
import type { ICPCriteria } from '@/lib/types';

const EXAMPLE_PROMPTS = [
  'AI startups that raised $50M+ and are hiring for MLOps or GPU infrastructure roles',
  'B2B SaaS companies in developer tools with Series B+ funding, hiring for platform engineering',
  'Climate tech startups with $20M+ funding building energy storage or grid optimization software',
  'Companies similar to Modal — AI-intensive, scaling compute, posting about distributed training'
];

export function ReviewStep({
  icp,
  setIcp,
  error,
  setError
}: {
  icp: ICPCriteria;
  setIcp: (icp: ICPCriteria) => void;
  error: string | null;
  setError: (e: string | null) => void;
}) {
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const updateField = <K extends keyof ICPCriteria>(field: K, value: ICPCriteria[K]) => {
    setIcp({ ...icp, [field]: value });
  };

  const handleGenerateFromPrompt = useCallback(async () => {
    if (!aiPrompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const data = await parseICP(aiPrompt.trim());
      setIcp(data);
      setAiPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate ICP');
    } finally {
      setIsGenerating(false);
    }
  }, [aiPrompt, isGenerating, setIcp, setError]);

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight">Review ICP</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Edit the fields below, or use AI to generate from a prompt.
        </p>
      </div>

      {error && <p className="text-destructive mb-4 text-sm">{error}</p>}

      {/* Example prompts — show when ICP is empty */}
      {!icp.description && !aiPrompt && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {EXAMPLE_PROMPTS.map((ep, i) => (
            <button
              key={i}
              onClick={() => setAiPrompt(ep)}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg border border-dashed px-2.5 py-1.5 text-left text-xs transition-colors"
            >
              {ep}
            </button>
          ))}
        </div>
      )}

      <div className="border-border bg-card overflow-hidden rounded-xl border">
        {/* Header — AI generate bar */}
        <div className="bg-muted/50 border-border flex items-center gap-2 border-b px-4 py-2.5">
          <Sparkles className="text-muted-foreground size-3.5 shrink-0" />
          <Input
            placeholder="Describe your ICP in plain English..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleGenerateFromPrompt();
            }}
            disabled={isGenerating}
            className="h-7 flex-1 border-none bg-transparent text-sm shadow-none focus-visible:ring-0"
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={handleGenerateFromPrompt}
            disabled={isGenerating || !aiPrompt.trim()}
            className="h-7 shrink-0 text-xs"
          >
            {isGenerating ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate'
            )}
          </Button>
        </div>

        {/* ICP fields */}
        <div className="space-y-5 p-4">
          <div>
            <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
              ICP Description
            </label>
            <Textarea
              value={icp.description}
              onChange={(e) => updateField('description', e.target.value)}
              className="text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                Min Funding ($M)
              </label>
              <Input
                type="number"
                value={icp.min_funding_amount ? icp.min_funding_amount / 1_000_000 : ''}
                onChange={(e) =>
                  updateField(
                    'min_funding_amount',
                    e.target.value ? Number(e.target.value) * 1_000_000 : null
                  )
                }
                placeholder="e.g. 50"
                className="text-sm"
              />
            </div>
            <TagEditor
              tags={icp.funding_stages}
              onChange={(v) => updateField('funding_stages', v)}
              label="Funding Stages"
            />
          </div>

          <TagEditor
            tags={icp.industry_keywords}
            onChange={(v) => updateField('industry_keywords', v)}
            label="Industry Keywords"
          />
          <TagEditor
            tags={icp.tech_keywords}
            onChange={(v) => updateField('tech_keywords', v)}
            label="Tech Keywords"
            color="default"
          />
          <TagEditor
            tags={icp.hiring_signals}
            onChange={(v) => updateField('hiring_signals', v)}
            label="Hiring Signals"
            color="blue"
          />
          <TagEditor
            tags={icp.company_examples}
            onChange={(v) => updateField('company_examples', v)}
            label="Example Companies"
            color="green"
          />
        </div>

        {/* Footer */}
        <div className="border-border border-t px-4 py-2.5">
          {icp.description.trim() ? (
            <span className="text-muted-foreground/60 text-xs">
              <kbd className="bg-muted rounded px-1 py-0.5 font-mono text-xs">Cmd+Enter</kbd> to
              find companies
            </span>
          ) : (
            <span className="text-muted-foreground text-xs">
              Fill in the ICP description to continue
            </span>
          )}
        </div>
      </div>
    </>
  );
}
