'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProfileStore } from '@/lib/store/profile-store';
import { toast } from 'sonner';

export function ProfileTab() {
  const fullName = useProfileStore((s) => s.fullName);
  const companyName = useProfileStore((s) => s.companyName);
  const profileLoaded = useProfileStore((s) => s.profileLoaded);
  const setFullName = useProfileStore((s) => s.setFullName);
  const setCompanyName = useProfileStore((s) => s.setCompanyName);
  const loadProfile = useProfileStore((s) => s.loadProfile);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, company_name: companyName })
      });
      if (!res.ok) throw new Error();
      toast.success('Profile saved');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xs space-y-4">
      <div className="space-y-1.5">
        <label className="text-muted-foreground text-xs font-medium">Full Name</label>
        <Input
          value={fullName ?? ''}
          onChange={(e) => setFullName(e.target.value)}
          placeholder={!profileLoaded ? 'Loading...' : 'Your name'}
          disabled={!profileLoaded}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-muted-foreground text-xs font-medium">Company Name</label>
        <Input
          value={companyName ?? ''}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder={!profileLoaded ? 'Loading...' : 'Your company'}
          disabled={!profileLoaded}
        />
      </div>
      <Button size="sm" onClick={handleSave} disabled={!profileLoaded || saving}>
        {saving && <Loader2 className="size-3.5 animate-spin" />}
        {saving ? 'Saving...' : 'Save'}
      </Button>
    </div>
  );
}
