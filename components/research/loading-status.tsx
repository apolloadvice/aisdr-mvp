import { Search, Building2, Users, Zap, Mail } from 'lucide-react';

const LOADING_STAGES = [
  { icon: Search, label: 'Searching for companies...' },
  { icon: Building2, label: 'Researching company details...' },
  { icon: Users, label: 'Finding decision makers...' },
  { icon: Zap, label: 'Analyzing buying signals...' },
  { icon: Mail, label: 'Crafting personalized hooks...' }
];

export function LoadingStatus({
  statusMessage,
  subtitle
}: {
  statusMessage: string;
  subtitle?: string;
}) {
  const stage = LOADING_STAGES.find((s) =>
    statusMessage.toLowerCase().includes(s.label.split(' ')[0].toLowerCase())
  );
  const CurrentIcon = stage?.icon ?? Search;

  return (
    <div className="bg-card border-border mb-6 overflow-hidden rounded-lg border">
      <div className="relative px-4 py-4">
        <div className="bg-muted absolute inset-x-0 bottom-0 h-0.5">
          <div className="bg-primary h-full w-1/3 animate-[shimmer_2s_ease-in-out_infinite] rounded-full" />
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex size-8 items-center justify-center rounded-lg">
            <CurrentIcon className="text-primary size-4 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{statusMessage || 'Searching...'}</p>
            {subtitle && <p className="text-muted-foreground mt-0.5 text-xs">{subtitle}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
