import { create } from 'zustand';
import { getGmailStatus } from '@/lib/api';

interface ProfileStore {
  open: boolean;
  tab: string;
  openProfile: (tab?: string) => void;
  closeProfile: () => void;
  setTab: (tab: string) => void;

  fullName: string | null;
  companyName: string | null;
  profileLoaded: boolean;
  setFullName: (name: string) => void;
  setCompanyName: (name: string) => void;
  loadProfile: () => Promise<void>;

  gmailConnected: boolean;
  gmailEmail: string | null;
  connectionsLoaded: boolean;
  setGmailStatus: (connected: boolean, email: string | null) => void;
  loadConnections: () => Promise<void>;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  open: false,
  tab: 'profile',
  openProfile: (tab) => set({ open: true, tab: tab ?? 'profile' }),
  closeProfile: () => set({ open: false }),
  setTab: (tab) => set({ tab }),

  fullName: null,
  companyName: null,
  profileLoaded: false,
  setFullName: (name) => set({ fullName: name }),
  setCompanyName: (name) => set({ companyName: name }),
  loadProfile: async () => {
    if (get().profileLoaded) return;
    const res = await fetch('/api/profile');
    const data: { full_name?: string; company_name?: string } = await res.json();
    set({
      fullName: data.full_name ?? '',
      companyName: data.company_name ?? '',
      profileLoaded: true
    });
  },

  gmailConnected: false,
  gmailEmail: null,
  connectionsLoaded: false,
  setGmailStatus: (connected, email) => set({ gmailConnected: connected, gmailEmail: email }),
  loadConnections: async () => {
    if (get().connectionsLoaded) return;
    const status = await getGmailStatus();
    set({ gmailConnected: status.connected, gmailEmail: status.email, connectionsLoaded: true });
  }
}));
