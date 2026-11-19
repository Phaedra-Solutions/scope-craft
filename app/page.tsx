'use client';

import React, { useState, useMemo, useSyncExternalStore } from 'react';
import { Header, ViewMode } from '@/components/Header';
import { ProjectCostCalculator } from '@/components/ProjectCostCalculator';
import { TeamCostCalculator } from '@/components/TeamCostCalculator';
import { CombinedStudio } from '@/components/CombinedStudio';
import { ScenarioComparison } from '@/components/ScenarioComparison';
import { PresetSelectorModal } from '@/components/PresetSelectorModal';
import { ProposalExportModal } from '@/components/ProposalExportModal';
import { GuidedScopingWizard } from '@/components/GuidedScopingWizard';
import { LiveEstimateSidebar } from '@/components/LiveEstimateSidebar';
import { Footer } from '@/components/Footer';

import { ProjectState, CurrencyConfig, LeadProfile } from '@/types/estimator';
import { CURRENCIES } from '@/lib/estimator-data';
import { calculateEstimate, generateRecommendedTeam } from '@/lib/estimator-engine';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, FileText } from 'lucide-react';
import Swal from 'sweetalert2';

const storageListeners = new Set<() => void>();

function subscribeStorage(callback: () => void) {
  storageListeners.add(callback);
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', callback);
  }
  return () => {
    storageListeners.delete(callback);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', callback);
    }
  };
}

let cachedRawUnlocked: string | null = null;
let cachedUnlockedBool: boolean = false;

function notifyStorageListeners() {
  cachedRawUnlocked = null;
  cachedUnlockedBool = false;
  cachedRawProfile = null;
  cachedProfileObj = null;
  storageListeners.forEach((cb) => cb());
}

function getStoredLeadUnlockedSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem('scopecraft_unlocked_lead') || localStorage.getItem('phaedra_unlocked_lead');
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
    subscribeStorage,
    getStoredLeadUnlockedSnapshot,
    () => false
  );
}

let cachedRawProfile: string | null = null;
let cachedProfileObj: LeadProfile | null = null;

function getStoredLeadProfileSnapshot(): LeadProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('scopecraft_lead_profile') || localStorage.getItem('phaedra_lead_profile');
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
    subscribeStorage,
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
  const [currency, setCurrency] = useState<CurrencyConfig>(CURRENCIES[0]);
  const [resetCounter, setResetCounter] = useState(0);

  // Modals
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Partial State Handler
  const handleUpdateProjectState = (updated: Partial<ProjectState>) => {
    setProjectState((prev) => ({ ...prev, ...updated }));
  };

  // Reset State & Clear All Session/Local Storage
  const handleReset = async () => {
    const result = await Swal.fire({
      title: 'Reset & Start Fresh?',
      text: 'This destructive action will clear all calculations, selections, session data, and local storage so you can calculate from the start.',
      icon: 'warning',
      iconColor: '#d97706',
      showCancelButton: true,
      confirmButtonText: 'Yes, Reset Everything',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      focusCancel: true,
      buttonsStyling: false,
      customClass: {
        container: 'lb-swal-backdrop',
        popup: 'lb-swal-popup',
        icon: '!border-amber-200 !bg-amber-50/80',
        title: '!font-sans !text-xl !font-bold !text-[#082A1C] lb-heading !pt-1',
        htmlContainer: '!font-sans !text-xs sm:!text-sm !text-[#64707A] !leading-relaxed',
        actions: '!w-full !flex !items-center !justify-center !gap-3 !pt-5 !mt-5 !border-t !border-[#DDE3E7]',
        confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-xs lb-btn-primary shadow-sm active:scale-[0.98] cursor-pointer',
        cancelButton: 'px-5 py-2.5 rounded-xl font-semibold text-xs text-[#082A1C] bg-[#F4F7F9] hover:bg-[#DDE3E7]/70 border border-[#DDE3E7] transition-all duration-200 active:scale-[0.98] cursor-pointer'
      }
    });

    if (!result.isConfirmed) return;

    try {
      localStorage.clear();
    } catch {
      // ignore storage quota/access errors
    }
    try {
      sessionStorage.clear();
    } catch {
      // ignore storage quota/access errors
    }

    notifyStorageListeners();
    setIsStudioUnlocked(false);
    setActiveLead(null);
    setProjectState({
      ...INITIAL_PROJECT_STATE,
      team: generateRecommendedTeam(
        INITIAL_PROJECT_STATE.selectedFeatureIds,
        INITIAL_PROJECT_STATE.platforms,
        INITIAL_PROJECT_STATE.complexity,
        INITIAL_PROJECT_STATE.designLevel
      ),
      customParams: []
    });
    setViewMode('combined');
    setCurrency(CURRENCIES[0]);
    setIsPresetModalOpen(false);
    setIsExportModalOpen(false);
    setResetCounter((prev) => prev + 1);

    void Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Workspace & storage cleared',
      showConfirmButton: false,
      timer: 2200,
      timerProgressBar: true,
      iconColor: '#cdff8c',
      customClass: {
        popup: 'lb-swal-toast'
      }
    });
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

  return (
    <div className="min-h-screen bg-white text-[#082A1C] font-sans flex flex-col lg:flex-row">
      {/* Main Content Workspace */}
      <div className="flex-1 min-w-0 flex flex-col pb-24 lg:pb-0">
        <Header
          viewMode={viewMode}
          setViewMode={setViewMode}
          regionId={projectState.regionId}
          setRegionId={(regionId) => handleUpdateProjectState({ regionId })}
          currency={currency}
          setCurrency={setCurrency}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onReset={handleReset}
          projectName={projectState.projectName}
          onChangeProjectName={(projectName) => handleUpdateProjectState({ projectName })}
          onOpenWizard={effectiveUnlocked ? () => setIsStudioUnlocked(false) : undefined}
          leadProfile={effectiveLead}
          showStudioTabs={effectiveUnlocked}
        />

        {!effectiveUnlocked ? (
          <main className="pt-4 flex-1">
            <GuidedScopingWizard
              key={resetCounter}
              initialState={projectState}
              onStateChange={handleUpdateProjectState}
              onOpenPresetModal={() => setIsPresetModalOpen(true)}
              onComplete={(lead, updatedState) => {
                setActiveLead(lead);
                setProjectState(updatedState);
                setIsStudioUnlocked(true);
              }}
              currencySymbol={currency.symbol}
              exchangeRate={currency.exchangeRate}
            />
          </main>
        ) : (
          <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex-1">
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
        )}

        <Footer />
      </div>

      {/* Desktop Live Estimate Sidebar (Glassmorphism Overlay) */}
      <LiveEstimateSidebar
        state={projectState}
        estimate={estimate}
        currencySymbol={currency.symbol}
        exchangeRate={currency.exchangeRate}
        isUnlocked={effectiveUnlocked}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenPresetModal={() => setIsPresetModalOpen(true)}
      />

      {/* Mobile Sticky Bottom Estimate Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#082A1C]/95 backdrop-blur-md border-t border-[#1A4332] shadow-2xl py-3 px-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center space-x-4">
            <div>
              <span className="text-[10px] uppercase font-semibold text-[#94A3B8] block">
                {effectiveUnlocked ? 'Total Est. Cost' : 'Investment'}
              </span>
              <span className="text-lg sm:text-xl font-bold text-[#CDFF8C] tracking-tight tabular-nums">
                {effectiveUnlocked
                  ? `${currency.symbol}${convertedGrandTotal.toLocaleString()}`
                  : 'Locked · Step 5'}
              </span>
            </div>

            <div className="hidden sm:block border-l border-[#1A4332] pl-3">
              <span className="text-[10px] uppercase font-semibold text-[#94A3B8] block">Timeline</span>
              <span className="text-xs font-semibold text-white flex items-center space-x-1 tabular-nums">
                <Clock className="w-3.5 h-3.5 text-[#CDFF8C]" />
                <span>{estimate.estimatedTimelineWeeks}w ({estimate.totalHours}h)</span>
              </span>
            </div>

            {effectiveUnlocked && (
              <div className="hidden md:block border-l border-[#1A4332] pl-3">
                <span className="text-[10px] uppercase font-semibold text-[#94A3B8] block">Monthly Burn</span>
                <span className="text-xs font-semibold text-[#CDFF8C] tabular-nums">
                  {currency.symbol}{convertedMonthlyBurn.toLocaleString()}/mo
                </span>
              </div>
            )}
          </div>

          {effectiveUnlocked && (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold lb-btn-lime active:scale-[0.98]"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export SOW</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <PresetSelectorModal
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        onSelectPreset={handleSelectPreset}
      />

      {effectiveUnlocked && (
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
      )}
    </div>
  );
}
