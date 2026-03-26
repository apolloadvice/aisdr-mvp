'use client';

import { useState, useRef, useEffect } from 'react';
import { Save, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useResearchStore } from '@/lib/store/research-store';
import { useICPStore } from '@/lib/store/icp-store';
import { IcpPanelEditable } from './icp-panel-editable';
import { StrategyChat } from './strategy-chat.client';

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
  const error = useResearchStore((s) => s.error);
  const icp = useResearchStore((s) => s.icp);

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
              className="bg-card flex w-full items-center justify-between rounded-[var(--card-radius)] px-4 py-3 shadow-xs"
            >
              <span className="text-muted-foreground section-label">Customer Profile</span>
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
          <StrategyChat />
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
