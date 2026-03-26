'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';

interface EditableNameProps {
  value: string;
  onSave: (name: string) => void | Promise<void>;
  /** Called after save or cancel completes — use to reset parent editing state */
  onDone?: () => void;
  /** Start in editing mode immediately (e.g. triggered by external button) */
  initialEditing?: boolean;
  className?: string;
  inputClassName?: string;
}

export function EditableName({
  value,
  onSave,
  onDone,
  initialEditing = false,
  className = '',
  inputClassName = ''
}: EditableNameProps) {
  const [editing, setEditing] = useState(initialEditing);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const finish = useCallback(
    (saved: boolean) => {
      const trimmed = draft.trim();
      if (saved && trimmed && trimmed !== value) {
        onSave(trimmed);
      } else {
        setDraft(value);
      }
      setEditing(false);
      onDone?.();
    },
    [draft, value, onSave, onDone]
  );

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => finish(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            finish(true);
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            finish(false);
          }
        }}
        onClick={(e) => e.stopPropagation()}
        className={inputClassName}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      className={`cursor-pointer truncate text-left transition-opacity hover:opacity-70 ${className}`}
    >
      {value}
    </button>
  );
}
