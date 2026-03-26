'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuthStore } from '@/lib/store/auth-store';
import { useProfileStore } from '@/lib/store/profile-store';
import { ProfileTab } from '@/components/settings/profile-tab.client';
import { AppearanceTab } from '@/components/settings/appearance-tab.client';
import { ConnectionsTab } from '@/components/settings/connections-tab.client';
import { SignaturesTab } from '@/components/settings/signatures-tab.client';
import { AccountTab } from '@/components/settings/account-tab.client';

const TAB_ITEMS = [
  { value: 'profile', label: 'Profile' },
  { value: 'appearance', label: 'Appearance' },
  { value: 'connections', label: 'Connections' },
  { value: 'signatures', label: 'Signatures' },
  { value: 'account', label: 'Account' }
];

export function ProfileModal() {
  const open = useProfileStore((s) => s.open);
  const tab = useProfileStore((s) => s.tab);
  const closeProfile = useProfileStore((s) => s.closeProfile);
  const setTab = useProfileStore((s) => s.setTab);
  const user = useAuthStore((s) => s.user);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && closeProfile()}>
      <DialogContent size="lg" className="p-0">
        <div className="flex max-h-[90dvh] flex-col md:h-[560px] md:flex-row">
          {/* Sidebar */}
          <div className="border-border flex w-full shrink-0 flex-col border-b p-4 md:w-48 md:border-r md:border-b-0">
            <DialogHeader className="mb-4 px-1">
              <DialogTitle className="text-sm">Settings</DialogTitle>
              <DialogDescription className="sr-only">
                Manage your account, connections, and preferences.
              </DialogDescription>
            </DialogHeader>
            <Tabs
              value={tab}
              onValueChange={setTab}
              orientation="vertical"
              className="!flex-row !gap-0 md:!flex-col"
            >
              <TabsList className="flex h-fit w-full flex-row gap-0.5 overflow-x-auto bg-transparent p-0 shadow-none md:flex-col">
                {TAB_ITEMS.map((item) => (
                  <TabsTrigger
                    key={item.value}
                    value={item.value}
                    className="w-full shrink-0 justify-start px-3 py-1.5 text-sm"
                  >
                    {item.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {tab === 'profile' && <ProfileTab />}
            {tab === 'appearance' && <AppearanceTab />}
            {tab === 'connections' && <ConnectionsTab />}
            {tab === 'signatures' && <SignaturesTab />}
            {tab === 'account' && <AccountTab user={user} />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
