'use client';

import { useState, useCallback } from 'react';
import { Pencil, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { TagEditor } from './tag-editor';
import type { ICPCriteria, ResearchStreamEvent } from '@/lib/types';

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
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: aiPrompt.trim() })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate ICP');
      }

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
            if (event.type === 'icp') {
              setIcp(event.data);
              setAiPrompt('');
              reader.cancel();
              return;
            }
            if (event.type === 'error') throw new Error(event.message);
          } catch (e) {
            if (e instanceof Error && e.message !== 'Failed to parse ICP from query') {
              // skip SSE parse errors
            } else {
              throw e;
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate ICP');
    } finally {
      setIsGenerating(false);
    }
  }, [aiPrompt, isGenerating, setIcp, setError]);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Review ICP</h2>
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Pencil className="size-3" />
            Click any field to edit
          </div>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          Edit the fields below, or use AI to generate from a prompt.
        </p>
      </div>

      {/* AI generate bar */}
      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Describe your ICP in plain English and let AI fill the fields..."
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleGenerateFromPrompt();
          }}
          disabled={isGenerating}
          className="flex-1 text-sm"
        />
        <Button
          onClick={handleGenerateFromPrompt}
          disabled={isGenerating || !aiPrompt.trim()}
          className="shrink-0"
        >
          {isGenerating ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          {isGenerating ? 'Generating...' : 'Generate'}
        </Button>
      </div>

      {/* Example prompts */}
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

      <Card>
        <CardContent className="space-y-5 pt-6">
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
        </CardContent>
      </Card>

      {error && <p className="text-destructive mt-4 text-sm">{error}</p>}
    </div>
  );
}
