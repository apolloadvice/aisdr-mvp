import { create } from 'zustand';
import { toast } from 'sonner';
import {
  parseICP,
  streamStrategy,
  discoverCompanies,
  researchCompanies,
  searchPeople,
  enrichPerson,
  updateSession,
  listContactedCompanies,
  listResearchedCompanies
} from '@/lib/api';
import type {
  ICPCriteria,
  CompanyResult,
  DiscoveredCompanyPreview,
  ApolloPersonPreview,
  StrategyMessage,
  GeneratedEmailSequence
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
  allPeopleResults: Record<string, ApolloPersonPreview[]>;
  isPeopleSearching: boolean;
  enrichingPersonIds: string[];

  // Shared
  statusMessage: string;
  error: string | null;

  // Email sequences
  emailSequences: Record<string, GeneratedEmailSequence>;

  // Abort controller (not serializable, but fine for zustand)
  abortController: AbortController | null;

  // Session persistence
  sessionId: string | null;
  sessionName: string;
  isSaving: boolean;
  lastSavedAt: string | null;

  // Contact tracking
  contactedCompanies: Map<string, string[]>;

  // Cross-session dedup
  previouslyResearched: Set<string>;
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

  // Step 4
  research: () => Promise<void>;
  searchPeopleAction: () => Promise<void>;
  enrichPersonAction: (personId: string, companyName: string) => Promise<void>;

  // Shared
  setError: (error: string | null) => void;
  startOver: () => void;
  skipToReview: () => void;

  // Email
  saveEmailSequence: (
    companyName: string,
    contactEmail: string,
    sequence: GeneratedEmailSequence
  ) => void;
  getEmailSequence: (companyName: string, contactEmail: string) => GeneratedEmailSequence | null;

  // Session persistence
  saveSession: () => Promise<void>;
  setSessionName: (name: string) => void;

  // Contact tracking
  loadContactedCompanies: () => Promise<void>;
  getContactedEmails: (companyName: string) => string[];

  // Cross-session dedup
  loadPreviouslyResearched: () => Promise<void>;
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
  allPeopleResults: {},
  isPeopleSearching: false,
  enrichingPersonIds: [],
  statusMessage: '',
  error: null,
  emailSequences: {},
  abortController: null,
  sessionId: null,
  sessionName: 'Untitled Session',
  isSaving: false,
  lastSavedAt: null,
  contactedCompanies: new Map(),
  previouslyResearched: new Set(),

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
      error: null,
      step: 'confirm'
    });

    try {
      const found = await discoverCompanies(icp, (event) => {
        if (event.type === 'status') {
          set({ statusMessage: event.message });
        }
      });
      // Merge new candidates with existing — new previews overwrite old for same name
      const { candidates: existing, selectedCompanies: existingSelected } = get();
      const merged = new Map<string, DiscoveredCompanyPreview>();
      for (const c of existing) merged.set(c.name, c);
      for (const c of found) merged.set(c.name, c);
      const mergedCandidates = [...merged.values()];
      // Auto-select new discoveries while preserving existing selections
      const newNames = found.map((c) => c.name);
      const selectedSet = new Set([...existingSelected, ...newNames]);
      set({
        candidates: mergedCandidates,
        selectedCompanies: [...selectedSet],
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

  // Step 4: Research
  research: async () => {
    const { icp, isResearching, selectedCompanies, candidates, results: existingResults } = get();
    if (!icp || isResearching || selectedCompanies.length === 0) return;

    // Only research companies that don't already have results
    const alreadyResearched = new Set(existingResults.map((r) => r.company_name));
    const newCompanies = selectedCompanies.filter((name) => !alreadyResearched.has(name));

    // If all selected are already researched, just navigate to results
    if (newCompanies.length === 0) {
      set({ step: 'results' });
      return;
    }

    const abortController = new AbortController();

    set({
      isResearching: true,
      statusMessage: '',
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
        newCompanies,
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
            case 'done': {
              const totalCount = get().results.length;
              set({
                statusMessage: `Research complete. ${totalCount} companies researched.`,
                researchingCompany: null
              });
              break;
            }
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

    // Filter out companies that already have people results
    const existingPeople = get().peopleResults;
    const newCompaniesWithOrgIds = companiesWithOrgIds.filter((c) => !existingPeople[c.name]);

    if (newCompaniesWithOrgIds.length === 0) return;

    set({ isPeopleSearching: true });

    try {
      const orgIds = newCompaniesWithOrgIds.map((c) => c.apollo_org_id);
      const results = await searchPeople(orgIds, icp, newCompaniesWithOrgIds);

      const newPeopleResults = Object.fromEntries(
        results.map((r) => [r.company_name, r.ranked_people])
      );
      const newAllPeopleResults = Object.fromEntries(
        results.map((r) => [r.company_name, r.all_people])
      );
      set((state) => ({
        peopleResults: { ...state.peopleResults, ...newPeopleResults },
        allPeopleResults: { ...state.allPeopleResults, ...newAllPeopleResults },
        isPeopleSearching: false
      }));
      get().saveSession();
    } catch (err) {
      console.error('People search failed:', err);
      set({ isPeopleSearching: false });
    }
  },

  enrichPersonAction: async (personId: string, companyName: string) => {
    const { enrichingPersonIds, peopleResults } = get();
    if (enrichingPersonIds.includes(personId)) return;

    // Skip API call if already enriched (saves Apollo credits)
    const existingPerson =
      peopleResults[companyName]?.find((p) => p.apollo_person_id === personId) ??
      get().allPeopleResults[companyName]?.find((p) => p.apollo_person_id === personId);
    if (existingPerson?.is_enriched) return;

    set({ enrichingPersonIds: [...enrichingPersonIds, personId] });

    try {
      const enriched = await enrichPerson(personId);

      set((state) => {
        const enrichData = {
          last_name: enriched.last_name,
          email: enriched.email ?? undefined,
          phone: enriched.phone ?? undefined,
          linkedin_url: enriched.linkedin_url ?? undefined,
          is_enriched: true as const
        };
        const applyEnrich = (p: ApolloPersonPreview) =>
          p.apollo_person_id === personId ? { ...p, ...enrichData } : p;

        const rankedPeople = (state.peopleResults[companyName] ?? []).map(applyEnrich);
        const allPeople = (state.allPeopleResults[companyName] ?? []).map(applyEnrich);

        // If enriched person isn't in rankedPeople (e.g. from contacts modal), append them
        const inRanked = rankedPeople.some((p) => p.apollo_person_id === personId);
        const enrichedPerson = allPeople.find((p) => p.apollo_person_id === personId);
        const finalRanked =
          !inRanked && enrichedPerson ? [...rankedPeople, enrichedPerson] : rankedPeople;

        return {
          peopleResults: { ...state.peopleResults, [companyName]: finalRanked },
          allPeopleResults: { ...state.allPeopleResults, [companyName]: allPeople },
          enrichingPersonIds: state.enrichingPersonIds.filter((id) => id !== personId)
        };
      });
      toast.success('Contact unlocked — 1 credit used');
      get().saveSession();
    } catch (err) {
      console.error('Person enrichment failed:', err);
      toast.error('Failed to unlock contact');
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
      allPeopleResults: {},
      isPeopleSearching: false,
      enrichingPersonIds: [],
      error: null,
      statusMessage: '',
      emailSequences: {},
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
  saveEmailSequence: (companyName, contactEmail, sequence) => {
    const key = `${companyName}::${contactEmail}`;
    set((state) => ({
      emailSequences: { ...state.emailSequences, [key]: sequence }
    }));
    get().saveSession();
  },

  getEmailSequence: (companyName, contactEmail) => {
    const key = `${companyName}::${contactEmail}`;
    return get().emailSequences[key] ?? null;
  },

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
      emailSequences,
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
        people_results: peopleResults,
        email_sequences: emailSequences
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

  getContactedEmails: (companyName: string) => {
    return get().contactedCompanies.get(companyName) ?? [];
  },

  // Cross-session dedup
  loadPreviouslyResearched: async () => {
    try {
      const { sessionId } = get();
      const companies = await listResearchedCompanies(sessionId ?? undefined);
      set({ previouslyResearched: new Set(companies) });
    } catch (err) {
      console.error('Failed to load previously researched:', err);
    }
  }
}));
