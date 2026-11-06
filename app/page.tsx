'use client';

import React, { useState, useMemo, useSyncExternalStore } from 'react';
import { Header, ViewMode } from '@/components/Header';
import { ProjectCostCalculator } from '@/components/ProjectCostCalculator';
import { TeamCostCalculator } from '@/components/TeamCostCalculator';
import { CombinedStudio } from '@/components/CombinedStudio';
import { ScenarioComparison } from '@/components/ScenarioComparison';
import { AiEstimatorModal } from '@/components/AiEstimatorModal';
import { PresetSelectorModal } from '@/components/PresetSelectorModal';
import { ProposalExportModal } from '@/components/ProposalExportModal';
import { GuidedScopingWizard } from '@/components/GuidedScopingWizard';

import { ProjectState, CurrencyConfig, LeadProfile } from '@/types/estimator';
import { CURRENCIES } from '@/lib/estimator-data';
import { calculateEstimate, generateRecommendedTeam } from '@/lib/estimator-engine';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Clock,
  FileText
} from 'lucide-react';

const emptySubscribe = () => () => {};

let cachedRawUnlocked: string | null = null;
let cachedUnlockedBool: boolean = false;

function getStoredLeadUnlockedSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem('phaedra_unlocked_lead');
    if (raw === cachedRawUnlocked) {
      return cachedUnlockedBool;
    }
    cachedRawUnlocked = raw;
    cachedUnlockedBool = raw === 'true';
    return cachedUnlockedBool;
  } catch {
    return false;
  }
}

function useStoredLeadUnlocked(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    getStoredLeadUnlockedSnapshot,
    () => false
  );
}

let cachedRawProfile: string | null = null;
let cachedProfileObj: LeadProfile | null = null;

function getStoredLeadProfileSnapshot(): LeadProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('phaedra_lead_profile');
    if (raw === cachedRawProfile) {
      return cachedProfileObj;
    }
    cachedRawProfile = raw;
    cachedProfileObj = raw ? (JSON.parse(raw) as LeadProfile) : null;
    return cachedProfileObj;
  } catch {
    return null;
  }
}

function useStoredLeadProfile(): LeadProfile | null {
  return useSyncExternalStore(
    emptySubscribe,
    getStoredLeadProfileSnapshot,
    () => null
  );
}

const INITIAL_PROJECT_STATE: ProjectState = {
  projectName: 'SaaS Platform MVP',
  clientName: 'Acme Corp',
  targetTimelineWeeks: 12,
  platforms: ['web'],
  complexity: 'standard',
  designLevel: 'standard_ui',
  qaLevel: 'standard',
  maintenancePeriod: '3_months',
  selectedFeatureIds: ['auth_basic', 'auth_sso', 'pay_stripe', 'cms_admin', 'analytics_charts'],
  regionId: 'phaedra',
  team: generateRecommendedTeam(
    ['auth_basic', 'auth_sso', 'pay_stripe', 'cms_admin', 'analytics_charts'],
    ['web'],
    'standard',
    'standard_ui'
  ),
  contingencyBufferPercent: 15,
  profitMarginPercent: 10,
  customParams: [],
  selectedSaaSAddons: ['aws_gcp', 'database_managed', 'ai_api_budget', 'vercel_cdn'],
  engagementModel: 'dedicated_team'
};

export default function Home() {
  const storedUnlocked = useStoredLeadUnlocked();
  const storedLead = useStoredLeadProfile();

  const [isStudioUnlocked, setIsStudioUnlocked] = useState(false);
  const [activeLead, setActiveLead] = useState<LeadProfile | null>(null);

  const effectiveUnlocked = isStudioUnlocked || storedUnlocked;
  const effectiveLead = activeLead || storedLead;

  const [projectState, setProjectState] = useState<ProjectState>(() => {
    return INITIAL_PROJECT_STATE;
  });
  const [viewMode, setViewMode] = useState<ViewMode>('combined');
  const [currency, setCurrency] = useState<CurrencyConfig>(CURRENCIES[0]); // USD default

  // Modals
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Partial State Handler
  const handleUpdateProjectState = (updated: Partial<ProjectState>) => {
    setProjectState((prev) => {
      const next = { ...prev, ...updated };
      return next;
    });
  };

  // Reset State
  const handleReset = () => {
    if (confirm('Reset calculator parameters to default SaaS MVP preset?')) {
      setProjectState(INITIAL_PROJECT_STATE);
    }
  };

  // Load Preset
  const handleSelectPreset = (presetState: Partial<ProjectState>) => {
    const fullState: ProjectState = {
      ...INITIAL_PROJECT_STATE,
      ...presetState,
      team: presetState.team || generateRecommendedTeam(
        presetState.selectedFeatureIds || ['auth_basic'],
        presetState.platforms || ['web'],
        presetState.complexity || 'standard',
        presetState.designLevel || 'standard_ui'
      )
    };
    setProjectState(fullState);
  };

  // Calculate Estimate
  const estimate = useMemo(() => {
    return calculateEstimate(projectState);
  }, [projectState]);

  const convertedGrandTotal = Math.round(estimate.grandTotalCost * currency.exchangeRate);
  const convertedMonthlyBurn = Math.round(estimate.teamMonthlyBurnRate * currency.exchangeRate);

  // If lead is not yet captured or user chooses to launch guided wizard
  if (!effectiveUnlocked) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
        <Header
          viewMode={viewMode}
          setViewMode={setViewMode}
          regionId={projectState.regionId}
          setRegionId={(regionId) => handleUpdateProjectState({ regionId })}
          currency={currency}
          setCurrency={setCurrency}
          onOpenAiModal={() => setIsAiModalOpen(true)}
          onOpenPresetModal={() => setIsPresetModalOpen(true)}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onReset={handleReset}
          projectName={projectState.projectName}
          onChangeProjectName={(projectName) => handleUpdateProjectState({ projectName })}
          leadProfile={effectiveLead}
        />

        <main className="pt-4">
          <GuidedScopingWizard
            initialState={projectState}
            onComplete={(lead, updatedState) => {
              setActiveLead(lead);
              setProjectState(updatedState);
              setIsStudioUnlocked(true);
            }}
            currencySymbol={currency.symbol}
            exchangeRate={currency.exchangeRate}
          />
        </main>

        <AiEstimatorModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          onApplyAiResult={(updated) => handleUpdateProjectState(updated)}
        />

        <PresetSelectorModal
          isOpen={isPresetModalOpen}
          onClose={() => setIsPresetModalOpen(false)}
          onSelectPreset={handleSelectPreset}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-28">
      
      {/* Header Bar */}
      <Header
        viewMode={viewMode}
        setViewMode={setViewMode}
        regionId={projectState.regionId}
        setRegionId={(regionId) => handleUpdateProjectState({ regionId })}
        currency={currency}
        setCurrency={setCurrency}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onOpenPresetModal={() => setIsPresetModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onReset={handleReset}
        projectName={projectState.projectName}
        onChangeProjectName={(projectName) => handleUpdateProjectState({ projectName })}
        onOpenWizard={() => setIsStudioUnlocked(false)}
        leadProfile={effectiveLead}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {viewMode === 'parameters' && (
              <ProjectCostCalculator
                state={projectState}
                onChange={handleUpdateProjectState}
                currencySymbol={currency.symbol}
                exchangeRate={currency.exchangeRate}
              />
            )}

            {viewMode === 'team' && (
              <TeamCostCalculator
                state={projectState}
                onChange={handleUpdateProjectState}
                currencySymbol={currency.symbol}
                exchangeRate={currency.exchangeRate}
              />
            )}

            {viewMode === 'combined' && (
              <CombinedStudio
                state={projectState}
                estimate={estimate}
                onChange={handleUpdateProjectState}
                currencySymbol={currency.symbol}
                exchangeRate={currency.exchangeRate}
                onOpenExportModal={() => setIsExportModalOpen(true)}
              />
            )}

            {viewMode === 'comparison' && (
              <ScenarioComparison
                currentState={projectState}
                onLoadState={setProjectState}
                currencySymbol={currency.symbol}
                exchangeRate={currency.exchangeRate}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Sticky Bottom Real-Time Cost Dock */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg py-3.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          <div className="flex items-center space-x-4 sm:space-x-8">
            <div>
              <span className="text-[11px] uppercase font-semibold text-slate-500 block">Total Est. Cost</span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {currency.symbol}{convertedGrandTotal.toLocaleString()}
              </span>
            </div>

            <div className="hidden sm:block border-l border-slate-200 pl-4">
              <span className="text-[11px] uppercase font-semibold text-slate-500 block">Timeline</span>
              <span className="text-sm font-bold text-slate-800 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>{estimate.estimatedTimelineWeeks} Weeks</span>
              </span>
            </div>

            <div className="hidden md:block border-l border-slate-200 pl-4">
              <span className="text-[11px] uppercase font-semibold text-slate-500 block">Monthly Burn</span>
              <span className="text-sm font-bold text-emerald-700">
                {currency.symbol}{convertedMonthlyBurn.toLocaleString()}/mo
              </span>
            </div>

            <div className="hidden lg:block border-l border-slate-200 pl-4">
              <span className="text-[11px] uppercase font-semibold text-slate-500 block">Dev Effort</span>
              <span className="text-sm font-semibold text-slate-700">
                {estimate.totalHours} Hours ({projectState.selectedFeatureIds.length} Modules)
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">AI Architect</span>
            </button>

            <button
              onClick={() => setIsExportModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export SOW</span>
            </button>
          </div>

        </div>
      </div>

      {/* Modals */}
      <AiEstimatorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyAiResult={(updated) => handleUpdateProjectState(updated)}
      />

      <PresetSelectorModal
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        onSelectPreset={handleSelectPreset}
      />

      <ProposalExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        state={projectState}
        estimate={estimate}
        currencySymbol={currency.symbol}
        exchangeRate={currency.exchangeRate}
        onImportState={(newState) => setProjectState(newState)}
        leadProfile={effectiveLead}
      />

    </div>
  );
}
