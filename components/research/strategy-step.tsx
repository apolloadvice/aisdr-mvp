'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, Send, Search, Save, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useResearchStore } from '@/lib/store/research-store';
import { useICPStore } from '@/lib/store/icp-store';
import { IcpPanelEditable } from './icp-panel-editable';

function SaveICPButton() {
  const icp = useResearchStore((s) => s.icp);
  const saveICP = useICPStore((s) => s.saveICP);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const defaultName = icp?.description?.slice(0, 40).trim() || '';

  useEffect(() => {
    if (naming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [naming]);

  const handleSave = async () => {
    const finalName = name.trim() || defaultName;
    if (!finalName || !icp) return;
    try {
      await saveICP(finalName, icp);
      toast.success('Saved to Profiles');
      setNaming(false);
      setName('');
    } catch {
      toast.error('Failed to save profile');
    }
  };

  if (naming) {
    return (
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') {
              setNaming(false);
              setName('');
            }
          }}
          placeholder={defaultName || 'ICP name...'}
          className="h-6 w-44 text-xs"
        />
        <Button size="icon-xs" label="Save" onClick={handleSave}>
          <Save className="size-3" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="xs"
      onClick={() => {
        setName(defaultName);
        setNaming(true);
      }}
      className="text-muted-foreground"
    >
      <Save className="size-3" />
      Save Profile
    </Button>
  );
}

function IcpPanel() {
  const icp = useResearchStore((s) => s.icp)!;
  const updateIcp = useResearchStore((s) => s.updateIcp);

  return (
    <IcpPanelEditable
      icp={icp}
      onUpdate={updateIcp}
      header={
        <>
          <span className="text-muted-foreground section-label">Customer Profile</span>
          <SaveICPButton />
        </>
      }
    />
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

  const [icpOpen, setIcpOpen] = useState(false);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="mb-4 shrink-0">
        <h2 className="text-xl font-semibold tracking-tight">Research Strategy</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Review the plan below. Request changes or approve to start researching.
        </p>
      </div>

      {error && <p className="text-destructive mb-3 shrink-0 text-sm">{error}</p>}

      {/* Mobile: stacked, Desktop: side-by-side with absolute chat */}
      <div className="flex flex-col gap-4 lg:relative lg:flex-row">
        {/* Mobile ICP toggle */}
        {icp && (
          <div className="lg:hidden">
            <button
              onClick={() => setIcpOpen(!icpOpen)}
              className="bg-card border-border flex w-full items-center justify-between rounded-[var(--card-radius)] border px-4 py-3"
            >
              <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Customer Profile
              </span>
              <ChevronDown
                className={`text-muted-foreground size-4 transition-transform duration-200 ${icpOpen ? 'rotate-180' : ''}`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-200 ${icpOpen ? 'mt-2 max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <IcpPanel />
            </div>
          </div>
        )}

        {/* Chat panel */}
        <div className="w-full lg:absolute lg:top-0 lg:bottom-0 lg:left-0 lg:w-80">
          <div className="border-border bg-card flex h-full min-h-[400px] flex-col overflow-hidden rounded-[var(--card-radius)] border lg:min-h-0">
            <div className="bg-muted/50 border-border flex shrink-0 items-center justify-between border-b px-4 py-2.5">
              <span className="text-muted-foreground section-label">Strategy Chat</span>
            </div>
            {/* Messages — scrollable */}
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {strategyMessages.map((msg, i) => (
                <div key={i} className={msg.role === 'user' ? 'flex justify-end' : ''}>
                  {msg.role === 'assistant' ? (
                    <div className="bg-muted/50 rounded-[var(--card-radius)] rounded-bl-md px-3 py-2">
                      <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-5">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>
                          }}
                        >
                          {msg.content.replace(/\n/g, '  \n')}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-primary text-primary-foreground rounded-[var(--card-radius)] rounded-br-md px-3 py-2 text-xs whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  )}
                </div>
              ))}

              {isStrategizing && !hasMessages && (
                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                  <Loader2 className="size-3 animate-spin" />
                  Analyzing your ICP...
                </div>
              )}

              {isStrategizing && statusMessage && (
                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                  <Search className="size-3 animate-pulse" />
                  {statusMessage}
                </div>
              )}
            </div>

            {/* Input — pinned to bottom */}
            <div className="border-border shrink-0 border-t px-4 py-3">
              <div className="flex items-end gap-2">
                <Textarea
                  placeholder="Request changes..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isStrategizing}
                  className="max-h-24 min-h-9 flex-1 resize-none text-xs"
                  rows={1}
                />
                <Button
                  size="icon"
                  label="Send"
                  onClick={handleSend}
                  disabled={isStrategizing || !input.trim()}
                >
                  {isStrategizing ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ICP Panel — desktop only, drives the row height */}
        {icp && (
          <div className="hidden min-w-0 flex-1 lg:block" style={{ marginLeft: '21rem' }}>
            <IcpPanel />
          </div>
        )}
      </div>
    </div>
  );
}
