'use client';

import { useState, useCallback } from 'react';
import { Loader2, Send, Search } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useResearchStore } from '@/lib/store/research-store';
import { Card } from '@/components/ui/card';
import type { StrategyMessage } from '@/lib/types';

function ChatMessage({ msg }: { msg: StrategyMessage }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="bg-primary text-primary-foreground rounded-[var(--card-radius)] rounded-br-md px-3 py-2 text-xs whitespace-pre-wrap">
          {msg.content}
        </div>
      </div>
    );
  }
  return (
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
  );
}

export function StrategyChat() {
  const strategyMessages = useResearchStore((s) => s.strategyMessages);
  const isStrategizing = useResearchStore((s) => s.isStrategizing);
  const statusMessage = useResearchStore((s) => s.statusMessage);
  const sendStrategyMessage = useResearchStore((s) => s.sendStrategyMessage);

  const [input, setInput] = useState('');

  const handleSend = useCallback(() => {
    if (!input.trim() || isStrategizing) return;
    sendStrategyMessage(input.trim());
    setInput('');
  }, [input, isStrategizing, sendStrategyMessage]);

  return (
    <Card className="h-full min-h-[400px] !gap-0 !py-0 lg:min-h-0">
      <div className="bg-muted/50 border-border flex shrink-0 items-center border-b px-4 py-2.5">
        <span className="text-muted-foreground section-label">Strategy Chat</span>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {strategyMessages.map((msg, i) => (
          <ChatMessage key={i} msg={msg} />
        ))}

        {isStrategizing && strategyMessages.length === 0 && (
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

      <div className="border-border shrink-0 border-t px-4 py-3">
        <div className="flex items-end gap-2">
          <Textarea
            placeholder="Request changes..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
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
    </Card>
  );
}
