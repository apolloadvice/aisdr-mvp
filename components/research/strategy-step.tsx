'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, Send, Check, Search, X, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useResearchStore } from '@/lib/store/research-store';

type TagColor = 'primary' | 'secondary' | 'blue' | 'green';

const TAG_COLORS: Record<TagColor, string> = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-muted text-muted-foreground',
  blue: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  green: 'bg-green-500/10 text-green-700 dark:text-green-400'
};

function EditableTagGroup({
  label,
  tags,
  color = 'primary',
  onChange
}: {
  label: string;
  tags: string[];
  color?: TagColor;
  onChange: (tags: string[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleRemove = (tag: string): void => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleAdd = (): void => {
    const trimmed = draft.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setDraft('');
    setAdding(false);
  };

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  return (
    <div>
      <label className="text-muted-foreground mb-1.5 block text-xs font-medium">{label}</label>
      <div className="flex flex-wrap items-center gap-1">
        {tags.map((tag) => (
          <span
            key={tag}
            className={`flex items-center gap-0.5 rounded-md px-2 py-0.5 text-xs ${TAG_COLORS[color]}`}
          >
            {tag}
            <button
              onClick={() => handleRemove(tag)}
              className="hover:text-destructive ml-0.5 opacity-60 transition-opacity hover:opacity-100"
            >
              <X className="size-2.5" />
            </button>
          </span>
        ))}
        {adding ? (
          <Input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') {
                setAdding(false);
                setDraft('');
              }
            }}
            onBlur={handleAdd}
            className="h-5 w-24 rounded-md border-none px-1.5 text-xs shadow-none focus-visible:ring-1"
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs transition-colors"
          >
            <Plus className="size-2.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function IcpPanel() {
  const icp = useResearchStore((s) => s.icp)!;
  const updateIcp = useResearchStore((s) => s.updateIcp);

  const formatMoney = (amount: number | null): string => {
    if (!amount) return '';
    return String(amount / 1_000_000);
  };

  return (
    <div className="border-border bg-card shrink-0 overflow-hidden rounded-xl border">
      <div className="bg-muted/50 border-border flex items-center justify-between border-b px-4 py-2.5">
        <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          Current ICP
        </span>
      </div>

      <div className="space-y-4 p-4">
        {/* Description */}
        <div>
          <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
            Description
          </label>
          <Textarea
            value={icp.description}
            onChange={(e) => updateIcp('description', e.target.value)}
            className="min-h-[60px] resize-none text-sm"
          />
        </div>

        {/* Tag fields */}
        <EditableTagGroup
          label="Industries"
          tags={icp.industry_keywords}
          onChange={(v) => updateIcp('industry_keywords', v)}
        />
        <EditableTagGroup
          label="Tech Keywords"
          tags={icp.tech_keywords}
          color="secondary"
          onChange={(v) => updateIcp('tech_keywords', v)}
        />
        <EditableTagGroup
          label="Hiring Signals"
          tags={icp.hiring_signals}
          color="blue"
          onChange={(v) => updateIcp('hiring_signals', v)}
        />
        <EditableTagGroup
          label="Example Companies"
          tags={icp.company_examples}
          color="green"
          onChange={(v) => updateIcp('company_examples', v)}
        />
        <EditableTagGroup
          label="Funding Stages"
          tags={icp.funding_stages}
          onChange={(v) => updateIcp('funding_stages', v)}
        />

        {/* Scalar fields */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
              Min Funding ($M)
            </label>
            <Input
              type="number"
              value={formatMoney(icp.min_funding_amount)}
              onChange={(e) =>
                updateIcp(
                  'min_funding_amount',
                  e.target.value ? Number(e.target.value) * 1_000_000 : null
                )
              }
              placeholder="e.g. 50"
              className="text-sm"
            />
          </div>

          <div>
            <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
              Min Employees
            </label>
            <Input
              type="number"
              value={icp.min_employees ?? ''}
              onChange={(e) =>
                updateIcp('min_employees', e.target.value ? Number(e.target.value) : null)
              }
              placeholder="—"
              className="text-sm"
            />
          </div>

          <div>
            <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
              Max Employees
            </label>
            <Input
              type="number"
              value={icp.max_employees ?? ''}
              onChange={(e) =>
                updateIcp('max_employees', e.target.value ? Number(e.target.value) : null)
              }
              placeholder="—"
              className="text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function StrategyStep() {
  const strategyMessages = useResearchStore((s) => s.strategyMessages);
  const isStrategizing = useResearchStore((s) => s.isStrategizing);
  const statusMessage = useResearchStore((s) => s.statusMessage);
  const error = useResearchStore((s) => s.error);
  const icp = useResearchStore((s) => s.icp);
  const sendStrategyMessage = useResearchStore((s) => s.sendStrategyMessage);
  const approveStrategy = useResearchStore((s) => s.approveStrategy);

  const [input, setInput] = useState('');

  const hasMessages = strategyMessages.length > 0;
  const lastMessage = strategyMessages[strategyMessages.length - 1];
  const canApprove = hasMessages && !isStrategizing && lastMessage?.role === 'assistant';

  const handleSend = useCallback(() => {
    if (!input.trim() || isStrategizing) return;
    sendStrategyMessage(input.trim());
    setInput('');
  }, [input, isStrategizing, sendStrategyMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col">
      {/* Header — fixed */}
      <div className="mb-4 shrink-0">
        <h2 className="text-xl font-semibold tracking-tight">Research Strategy</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Review the plan below. Request changes or approve to start researching.
        </p>
      </div>

      {error && <p className="text-destructive mb-3 shrink-0 text-sm">{error}</p>}

      {/* ICP Panel — fixed at top */}
      {icp && <IcpPanel />}

      {/* Chat card */}
      <div className="border-border bg-card mt-4 flex flex-col overflow-hidden rounded-xl border">
        {/* Messages — scrollable, tall */}
        <div className="max-h-[60vh] min-h-[400px] space-y-6 overflow-y-auto p-4">
          {strategyMessages.map((msg, i) => (
            <div key={i} className={msg.role === 'user' ? 'flex justify-end' : ''}>
              {msg.role === 'assistant' ? (
                <div className="bg-muted/50 max-w-[60%] rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-6">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>
                      }}
                    >
                      {msg.content.replace(/\n/g, '  \n')}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="bg-primary text-primary-foreground max-w-[60%] rounded-2xl rounded-br-md px-3 py-2 text-sm whitespace-pre-wrap">
                  {msg.content}
                </div>
              )}
            </div>
          ))}

          {isStrategizing && !hasMessages && (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-3.5 animate-spin" />
              Analyzing your ICP and building a strategy...
            </div>
          )}

          {isStrategizing && statusMessage && (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Search className="size-3 animate-pulse" />
              {statusMessage}
            </div>
          )}
        </div>

        {/* Input + actions — pinned to bottom */}
        <div className="border-border shrink-0 border-t px-4 py-3">
          <div className="flex items-end gap-2">
            <Textarea
              placeholder="Request changes or provide a URL to scrape..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStrategizing}
              className="max-h-32 min-h-[44px] flex-1 resize-none text-sm"
              rows={1}
            />
            <Button
              variant="ghost"
              onClick={handleSend}
              disabled={isStrategizing || !input.trim()}
              className="shrink-0"
            >
              {isStrategizing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Send
            </Button>
            {canApprove && (
              <Button onClick={approveStrategy} className="shrink-0">
                <Check className="size-4" />
                Approve &amp; Start
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
