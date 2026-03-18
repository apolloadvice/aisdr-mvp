import { create } from 'zustand';
import {
  parseICP,
  streamStrategy,
  discoverCompanies,
  researchCompanies,
  searchPeople,
  enrichPerson,
  updateSession,
  listContactedCompanies
} from '@/lib/api';
import type {
  ICPCriteria,
  CompanyResult,
  ComposeEmailParams,
  DiscoveredCompanyPreview,
  ApolloPersonPreview,
  StrategyMessage
} from '@/lib/types';

type Step = 'input' | 'review' | 'confirm' | 'results';

const EMPTY_ICP: ICPCriteria = {
  description: '',
  industry_keywords: [],
  min_employees: null,
  max_employees: null,
  min_funding_amount: null,
  funding_stages: [],
  hiring_signals: [],
  tech_keywords: [],
  company_examples: []
};

interface ResearchState {
  // Navigation
  step: Step;

  // Step 1: Transcript
  transcript: string;
  isExtracting: boolean;

  // Step 2: Strategy
  icp: ICPCriteria | null;
  strategyMessages: StrategyMessage[];
  isStrategizing: boolean;

  // Step 3: Discovery
  isDiscovering: boolean;
  candidates: DiscoveredCompanyPreview[];
  selectedCompanies: string[];

  // Step 4: Research
  isResearching: boolean;
  results: CompanyResult[];
  researchingCompany: string | null;

  // People search
  peopleResults: Record<string, ApolloPersonPreview[]>;
  isPeopleSearching: boolean;
  enrichingPersonIds: string[];

  // Shared
  statusMessage: string;
  error: string | null;

  // Email composer
  composeParams: ComposeEmailParams | null;

  // Abort controller (not serializable, but fine for zustand)
  abortController: AbortController | null;

  // Session persistence
  sessionId: string | null;
  sessionName: string;
  isSaving: boolean;
  lastSavedAt: string | null;

  // Contact tracking
  contactedCompanies: Map<string, string[]>;
}

interface ResearchActions {
  // Navigation
  setStep: (step: Step) => void;

  // Step 1
  setTranscript: (transcript: string) => void;
  extractICP: () => Promise<void>;

  // Step 2: Strategy
  updateIcp: <K extends keyof ICPCriteria>(field: K, value: ICPCriteria[K]) => void;
  generateStrategy: () => Promise<void>;
  sendStrategyMessage: (message: string) => Promise<void>;
  approveStrategy: () => void;

  // Step 3
  discover: () => Promise<void>;
  setSelectedCompanies: (companies: string[]) => void;
  toggleCompany: (name: string) => void;
  selectAll: () => void;
  deselectAll: () => void;

  // Step 4
  research: () => Promise<void>;
  searchPeopleAction: () => Promise<void>;
  enrichPersonAction: (personId: string, companyName: string) => Promise<void>;

  // Shared
  setError: (error: string | null) => void;
  startOver: () => void;
  skipToReview: () => void;

  // Email
  setComposeParams: (params: ComposeEmailParams | null) => void;

  // Session persistence
  saveSession: () => Promise<void>;
  setSessionName: (name: string) => void;

  // Contact tracking
  loadContactedCompanies: () => Promise<void>;
  isContactContacted: (companyName: string, email: string) => boolean;
  getContactedEmails: (companyName: string) => string[];

  // Derived getters
  selectedCandidates: () => DiscoveredCompanyPreview[];
}

export type ResearchStore = ResearchState & ResearchActions;

function buildStrategyCallbacks(
  set: (partial: Partial<ResearchState>) => void,
  get: () => ResearchStore,
  priorMessages: StrategyMessage[]
): {
  onChunk: (text: string) => void;
  onStatus: (message: string) => void;
  onIcpUpdate: (updates: Partial<ICPCriteria>) => void;
} {
  return {
    onChunk: (text) => {
      set({
        strategyMessages: [...priorMessages, { role: 'assistant', content: text }]
      });
    },
    onStatus: (message) => {
      set({ statusMessage: message });
    },
    onIcpUpdate: (updates) => {
      const current = get().icp;
      if (current) set({ icp: { ...current, ...updates } });
    }
  };
}

export const useResearchStore = create<ResearchStore>((set, get) => ({
  // Initial state
  step: 'input',
  transcript: '',
  isExtracting: false,
  icp: null,
  strategyMessages: [],
  isStrategizing: false,
  isDiscovering: false,
  candidates: [],
  selectedCompanies: [],
  isResearching: false,
  results: [],
  researchingCompany: null,
  peopleResults: {},
  isPeopleSearching: false,
  enrichingPersonIds: [],
  statusMessage: '',
  error: null,
  composeParams: null,
  abortController: null,
  sessionId: null,
  sessionName: 'Untitled Session',
  isSaving: false,
  lastSavedAt: null,
  contactedCompanies: new Map(),

  // Navigation
  setStep: (step) => set({ step }),

  // Step 1: Transcript
  setTranscript: (transcript) => set({ transcript }),

  extractICP: async () => {
    const { transcript, isExtracting } = get();
    if (!transcript.trim() || isExtracting) return;

    set({ isExtracting: true, error: null });

    try {
      const data = await parseICP(transcript.trim());
      set({
        icp: { ...data, description: transcript.trim() },
        step: 'review',
        isExtracting: false,
        strategyMessages: []
      });
      // Auto-save: update session name from ICP description + save state
      const { sessionId } = get();
      if (sessionId) {
        const name = transcript.trim().slice(0, 60) || 'Untitled Session';
        set({ sessionName: name });
      }
      get().saveSession();
      // Auto-generate strategy after ICP is parsed
      get().generateStrategy();
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to extract ICP',
        isExtracting: false
      });
    }
  },

  // Step 2: Strategy
  updateIcp: (field, value) => {
    const current = get().icp;
    if (current) set({ icp: { ...current, [field]: value } });
  },

  generateStrategy: async () => {
    const { icp, isStrategizing } = get();
    if (!icp || isStrategizing) return;

    set({ isStrategizing: true, error: null, strategyMessages: [] });

    try {
      const cleanText = await streamStrategy(icp, [], buildStrategyCallbacks(set, get, []));
      set({ strategyMessages: [{ role: 'assistant', content: cleanText }] });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Strategy generation failed'
      });
    } finally {
      set({ isStrategizing: false, statusMessage: '' });
    }
  },

  sendStrategyMessage: async (message: string) => {
    const { icp, isStrategizing, strategyMessages } = get();
    if (!icp || isStrategizing || !message.trim()) return;

    const updatedMessages: StrategyMessage[] = [
      ...strategyMessages,
      { role: 'user', content: message.trim() }
    ];

    set({
      isStrategizing: true,
      error: null,
      strategyMessages: updatedMessages
    });

    try {
      const cleanText = await streamStrategy(
        icp,
        updatedMessages,
        buildStrategyCallbacks(set, get, updatedMessages)
      );
      set({
        strategyMessages: [...updatedMessages, { role: 'assistant', content: cleanText }]
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Strategy update failed'
      });
    } finally {
      set({ isStrategizing: false, statusMessage: '' });
    }
  },

  approveStrategy: () => {
    get().discover();
  },

  // Step 3: Discovery
  discover: async () => {
    const { icp, isDiscovering } = get();
    if (!icp || isDiscovering) return;

    set({
      isDiscovering: true,
      statusMessage: '',
      candidates: [],
      selectedCompanies: [],
      error: null,
      step: 'confirm'
    });

    try {
      const found = await discoverCompanies(icp, (event) => {
        if (event.type === 'status') {
          set({ statusMessage: event.message });
        }
      });
      set({
        candidates: found,
        selectedCompanies: found.map((c) => c.name),
        isDiscovering: false
      });
      // Auto-save after discovery
      get().saveSession();
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Discovery failed',
        isDiscovering: false
      });
    }
  },

  setSelectedCompanies: (companies) => set({ selectedCompanies: companies }),

  toggleCompany: (name) => {
    const { selectedCompanies } = get();
    const selected = new Set(selectedCompanies);
    if (selected.has(name)) {
      selected.delete(name);
    } else {
      selected.add(name);
    }
    set({ selectedCompanies: [...selected] });
  },

  selectAll: () => {
    const { candidates } = get();
    set({ selectedCompanies: candidates.map((c) => c.name) });
  },

  deselectAll: () => set({ selectedCompanies: [] }),

  // Step 4: Research
  research: async () => {
    const { icp, isResearching, selectedCompanies, candidates } = get();
    if (!icp || isResearching || selectedCompanies.length === 0) return;

    const abortController = new AbortController();

    set({
      isResearching: true,
      statusMessage: '',
      results: [],
      researchingCompany: null,
      error: null,
      step: 'results',
      abortController
    });

    // Fire people search in parallel with company research
    get().searchPeopleAction();

    try {
      await researchCompanies(
        icp,
        selectedCompanies,
        (event) => {
          switch (event.type) {
            case 'status': {
              set({ statusMessage: event.message });
              const match = event.message.match(/^Researching (.+?) \(/);
              if (match) {
                set({ researchingCompany: match[1] });
              }
              break;
            }
            case 'company':
              set((state) => ({
                results: [...state.results, event.data],
                researchingCompany: null
              }));
              // Auto-save after each company result
              get().saveSession();
              break;
            case 'done':
              set({
                statusMessage: `Research complete. Found ${event.total} companies.`,
                researchingCompany: null
              });
              break;
          }
        },
        abortController.signal,
        candidates
      );
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      set({
        error: err instanceof Error ? err.message : 'Something went wrong'
      });
    } finally {
      set({ isResearching: false, researchingCompany: null, abortController: null });
      // Mark session completed after research
      const { sessionId } = get();
      if (sessionId) {
        updateSession(sessionId, { status: 'completed' }).catch(() => {});
      }
      get().saveSession();
    }
  },

  // People search
  searchPeopleAction: async () => {
    const { icp, candidates, selectedCompanies } = get();
    if (!icp) return;

    const selectedSet = new Set(selectedCompanies);
    const companiesWithOrgIds = candidates
      .filter((c) => selectedSet.has(c.name) && c.apollo_org_id)
      .map((c) => ({ name: c.name, apollo_org_id: c.apollo_org_id! }));

    if (companiesWithOrgIds.length === 0) return;

    set({ isPeopleSearching: true });

    try {
      const orgIds = companiesWithOrgIds.map((c) => c.apollo_org_id);
      const results = await searchPeople(orgIds, icp, companiesWithOrgIds);

      const peopleResults = Object.fromEntries(
        results.map((r) => [r.company_name, r.ranked_people])
      );
      set({ peopleResults, isPeopleSearching: false });
    } catch (err) {
      console.error('People search failed:', err);
      set({ isPeopleSearching: false });
    }
  },

  enrichPersonAction: async (personId: string, companyName: string) => {
    const { enrichingPersonIds } = get();
    if (enrichingPersonIds.includes(personId)) return;

    set({ enrichingPersonIds: [...enrichingPersonIds, personId] });

    try {
      const enriched = await enrichPerson(personId);

      set((state) => {
        const people = state.peopleResults[companyName] ?? [];
        const updated = people.map((p) =>
          p.apollo_person_id === personId
            ? {
                ...p,
                last_name: enriched.last_name,
                email: enriched.email ?? undefined,
                phone: enriched.phone ?? undefined,
                linkedin_url: enriched.linkedin_url ?? undefined,
                is_enriched: true
              }
            : p
        );

        return {
          peopleResults: { ...state.peopleResults, [companyName]: updated },
          enrichingPersonIds: state.enrichingPersonIds.filter((id) => id !== personId)
        };
      });
    } catch (err) {
      console.error('Person enrichment failed:', err);
      set((state) => ({
        enrichingPersonIds: state.enrichingPersonIds.filter((id) => id !== personId)
      }));
    }
  },

  // Shared
  setError: (error) => set({ error }),

  startOver: () =>
    set({
      step: 'input',
      icp: null,
      strategyMessages: [],
      isStrategizing: false,
      candidates: [],
      selectedCompanies: [],
      results: [],
      researchingCompany: null,
      peopleResults: {},
      isPeopleSearching: false,
      enrichingPersonIds: [],
      error: null,
      statusMessage: '',
      composeParams: null,
      sessionId: null,
      sessionName: 'Untitled Session',
      isSaving: false,
      lastSavedAt: null
    }),

  skipToReview: () => {
    const { icp } = get();
    if (!icp) set({ icp: { ...EMPTY_ICP } });
    set({ step: 'review', strategyMessages: [] });
  },

  // Email
  setComposeParams: (params) => set({ composeParams: params }),

  // Session persistence
  saveSession: async () => {
    const {
      sessionId,
      isSaving,
      transcript,
      step,
      icp,
      strategyMessages,
      candidates,
      selectedCompanies,
      results,
      peopleResults,
      sessionName
    } = get();
    if (!sessionId || isSaving) return;

    set({ isSaving: true });
    try {
      await updateSession(sessionId, {
        name: sessionName,
        transcript,
        step,
        icp,
        strategy_messages: strategyMessages,
        candidates,
        selected_companies: selectedCompanies,
        results,
        people_results: peopleResults
      });
      set({ lastSavedAt: new Date().toISOString() });
    } catch (err) {
      console.error('Failed to save session:', err);
    } finally {
      set({ isSaving: false });
    }
  },

  setSessionName: (name: string) => set({ sessionName: name }),

  // Contact tracking
  loadContactedCompanies: async () => {
    try {
      const contacts = await listContactedCompanies();
      const map = new Map<string, string[]>();
      for (const c of contacts) {
        const existing = map.get(c.company_name) ?? [];
        existing.push(c.contact_email);
        map.set(c.company_name, existing);
      }
      set({ contactedCompanies: map });
    } catch (err) {
      console.error('Failed to load contacted companies:', err);
    }
  },

  isContactContacted: (companyName: string, email: string) => {
    const emails = get().contactedCompanies.get(companyName);
    return emails?.includes(email) ?? false;
  },

  getContactedEmails: (companyName: string) => {
    return get().contactedCompanies.get(companyName) ?? [];
  },

  // Derived
  selectedCandidates: () => {
    const { candidates, selectedCompanies } = get();
    const selectedSet = new Set(selectedCompanies);
    return candidates.filter((c) => selectedSet.has(c.name));
  }
}));
