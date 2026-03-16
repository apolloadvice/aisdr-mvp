'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const COLOR_CLASSES = {
  default: 'bg-primary/10 text-primary hover:bg-primary/20',
  blue: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 dark:text-blue-400',
  green: 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400'
};

export function TagEditor({
  tags,
  onChange,
  label,
  color = 'default'
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  label: string;
  color?: 'default' | 'blue' | 'green';
}) {
  const [adding, setAdding] = useState(false);
  const [newTag, setNewTag] = useState('');

  const handleAdd = () => {
    if (newTag.trim()) {
      onChange([...tags, newTag.trim()]);
      setNewTag('');
      setAdding(false);
    }
  };

  return (
    <div>
      <label className="text-muted-foreground mb-1.5 block text-xs font-medium">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag, i) => (
          <Badge
            key={i}
            variant="secondary"
            className={`${COLOR_CLASSES[color]} gap-1 pr-1 text-xs`}
          >
            {tag}
            <button
              onClick={() => onChange(tags.filter((_, j) => j !== i))}
              className="hover:bg-foreground/10 rounded-full p-0.5"
            >
              <X className="size-2.5" />
            </button>
          </Badge>
        ))}
        {adding ? (
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') setAdding(false);
            }}
            onBlur={handleAdd}
            className="h-6 w-32 text-xs"
            autoFocus
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-0.5 rounded-full border border-dashed px-2 py-0.5 text-xs transition-colors"
          >
            <Plus className="size-2.5" />
            Add
          </button>
        )}
      </div>
    </div>
  );
}
