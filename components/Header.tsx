'use client';

import React from 'react';
import {
  Sparkles,
  Sliders,
  Users,
  Layers,
  GitCompare,
  FileText,
  Globe2,
  Coins,
  BookmarkPlus,
  RotateCcw,
  Compass,
  CheckCircle2
} from 'lucide-react';
import { CURRENCIES, REGIONS } from '@/lib/estimator-data';
import { CurrencyConfig, LeadProfile } from '@/types/estimator';

export type ViewMode = 'parameters' | 'team' | 'combined' | 'comparison';

interface HeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  regionId: string;
  setRegionId: (id: string) => void;
  currency: CurrencyConfig;
  setCurrency: (currency: CurrencyConfig) => void;
  onOpenAiModal: () => void;
  onOpenPresetModal: () => void;
  onOpenExportModal: () => void;
  onReset: () => void;
  projectName: string;
  onChangeProjectName: (name: string) => void;
  onOpenWizard?: () => void;
  leadProfile?: LeadProfile | null;
  showStudioTabs?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  setViewMode,
  regionId,
  setRegionId,
  currency,
  setCurrency,
  onOpenAiModal,
  onOpenPresetModal,
  onOpenExportModal,
  onReset,
  projectName,
  onChangeProjectName,
  onOpenWizard,
  leadProfile,
  showStudioTabs = true
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#DDE3E7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Tier: Branding, Project Title, and Key Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between py-3.5 gap-4">
          {/* Brand & Project Identity */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#082A1C] flex items-center justify-center text-[#CDFF8C] flex-shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-[#082A1C] text-sm lb-heading whitespace-nowrap">ScopeCraft</span>
                <span className="text-[#94A3B8]">/</span>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => onChangeProjectName(e.target.value)}
                  className="font-semibold text-sm text-[#082A1C] bg-transparent hover:bg-[#F4F7F9] focus:bg-[#F4F7F9] px-2 py-0.5 rounded-lg border border-transparent hover:border-[#DDE3E7] focus:border-[#082A1C] transition-all duration-200 focus:outline-none max-w-[220px] sm:max-w-xs truncate placeholder:text-[#64707A]"
                  placeholder="Project Name..."
                  title="Click to rename project"
                />
              </div>
              <p className="text-xs text-[#64707A]">
                Precision Software Scoping & Architecture Studio
              </p>
            </div>
          </div>

          {/* Action Tools & Dropdowns */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Guided Wizard Launcher */}
            {onOpenWizard && (
              <button
                type="button"
                onClick={onOpenWizard}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#082A1C] bg-[#CDFF8C] hover:bg-[#bfff6e] border border-[#082A1C]/15 transition-all duration-200 active:scale-[0.98] whitespace-nowrap shrink-0"
                title="Relaunch 4-Step Guided Wizard"
              >
                <Compass className="w-3.5 h-3.5 text-[#082A1C]" />
                <span>Guided Wizard</span>
              </button>
            )}

            {/* AI Scope Architect */}
            <button
              type="button"
              onClick={onOpenAiModal}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#082A1C] bg-[#F4F7F9] hover:bg-[#DDE3E7]/60 border border-[#DDE3E7] transition-all duration-200 active:scale-[0.98] whitespace-nowrap shrink-0"
              title="Generate customized architectural recommendations"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#082A1C]" />
              <span>AI Scope</span>
            </button>

            {/* Templates Preset */}
            <button
              type="button"
              onClick={onOpenPresetModal}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#082A1C] bg-[#F4F7F9] hover:bg-[#DDE3E7]/60 border border-[#DDE3E7] transition-all duration-200 active:scale-[0.98] whitespace-nowrap shrink-0"
              title="Load industry presets"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-[#64707A]" />
              <span className="hidden sm:inline">Presets</span>
            </button>

            {/* Verified Prospect Badge */}
            {leadProfile && (
              <div className="hidden xl:flex items-center space-x-1.5 text-xs text-[#082A1C] bg-[#CDFF8C]/50 border border-[#082A1C]/15 rounded-xl px-2.5 py-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#082A1C]" />
                <span className="font-semibold truncate max-w-[130px]">{leadProfile.company || leadProfile.fullName}</span>
              </div>
            )}

            {/* Location Benchmark Dropdown */}
            <div className="flex items-center space-x-1.5 bg-[#F4F7F9] border border-[#DDE3E7] rounded-xl px-2.5 py-1.5">
              <Globe2 className="w-3.5 h-3.5 text-[#64707A]" />
              <select
                value={regionId}
                onChange={(e) => setRegionId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-[#082A1C] focus:outline-none cursor-pointer pr-1"
                title="Select location rate benchmark"
              >
                {REGIONS.map((r) => (
                  <option key={r.id} value={r.id} className="bg-white text-[#082A1C]">
                    {r.flag} {r.name} ({(r.rateMultiplier * 100).toFixed(0)}%)
                  </option>
                ))}
              </select>
            </div>

            {/* Currency Selector */}
            <div className="flex items-center space-x-1.5 bg-[#F4F7F9] border border-[#DDE3E7] rounded-xl px-2.5 py-1.5">
              <Coins className="w-3.5 h-3.5 text-[#64707A]" />
              <select
                value={currency.code}
                onChange={(e) => {
                  const found = CURRENCIES.find((c) => c.code === e.target.value);
                  if (found) setCurrency(found);
                }}
                className="bg-transparent text-xs font-semibold text-[#082A1C] focus:outline-none cursor-pointer"
                title="Select display currency"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code} className="bg-white text-[#082A1C]">
                    {c.symbol} {c.code}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Defaults */}
            <button
              type="button"
              onClick={onReset}
              title="Reset & Start Fresh (Clear all saved data)"
              aria-label="Reset & Start Fresh"
              className="p-2 text-[#64707A] hover:text-[#082A1C] hover:bg-[#F4F7F9] border border-transparent hover:border-[#DDE3E7] rounded-xl transition-all duration-200 active:scale-[0.98]"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Export SOW Button */}
            {showStudioTabs && (
              <button
                type="button"
                onClick={onOpenExportModal}
                className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold lb-btn-primary active:scale-[0.98] whitespace-nowrap shrink-0"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export SOW</span>
              </button>
            )}
          </div>
        </div>

        {/* View Navigation Tabs (Flat Minimalism) */}
        {showStudioTabs && (
          <div className="flex items-center space-x-4 border-t border-[#DDE3E7] pt-1 -mb-px overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setViewMode('combined')}
              className={`flex items-center space-x-2 px-2 py-2.5 text-xs font-semibold border-b-2 transition-all duration-200 active:scale-[0.98] whitespace-nowrap ${
                viewMode === 'combined'
                  ? 'border-[#082A1C] text-[#082A1C]'
                  : 'border-transparent text-[#64707A] hover:text-[#082A1C]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Executive Studio</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('parameters')}
              className={`flex items-center space-x-2 px-2 py-2.5 text-xs font-semibold border-b-2 transition-all duration-200 active:scale-[0.98] whitespace-nowrap ${
                viewMode === 'parameters'
                  ? 'border-[#082A1C] text-[#082A1C]'
                  : 'border-transparent text-[#64707A] hover:text-[#082A1C]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>1. Scope Parameters</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('team')}
              className={`flex items-center space-x-2 px-2 py-2.5 text-xs font-semibold border-b-2 transition-all duration-200 active:scale-[0.98] whitespace-nowrap ${
                viewMode === 'team'
                  ? 'border-[#082A1C] text-[#082A1C]'
                  : 'border-transparent text-[#64707A] hover:text-[#082A1C]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>2. Team Squad</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('comparison')}
              className={`flex items-center space-x-2 px-2 py-2.5 text-xs font-semibold border-b-2 transition-all duration-200 active:scale-[0.98] whitespace-nowrap ${
                viewMode === 'comparison'
                  ? 'border-[#082A1C] text-[#082A1C]'
                  : 'border-transparent text-[#64707A] hover:text-[#082A1C]'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>3. Scenario Comparison</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
