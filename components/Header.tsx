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
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Tier: Branding, Project Title, and Key Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between py-3.5 gap-4">
          {/* Brand & Project Identity */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 border border-indigo-500/50 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 flex-shrink-0">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-100 text-sm tracking-tight">ScopeCraft</span>
                <span className="text-slate-600">/</span>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => onChangeProjectName(e.target.value)}
                  className="font-semibold text-sm text-slate-100 bg-transparent hover:bg-slate-800/80 focus:bg-slate-800 px-2 py-0.5 rounded-md border border-transparent hover:border-slate-700/50 focus:border-indigo-500 transition-all duration-200 focus:outline-none max-w-[220px] sm:max-w-xs truncate placeholder:text-slate-500"
                  placeholder="Project Name..."
                  title="Click to rename project"
                />
              </div>
              <p className="text-xs text-slate-400">
                Precision Software Scoping & Architecture Studio
              </p>
            </div>
          </div>

          {/* Action Tools & Dropdowns */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Guided Wizard Launcher */}
            {onOpenWizard && (
              <button
                type="button"
                onClick={onOpenWizard}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all duration-200 active:scale-[0.98]"
                title="Relaunch 4-Step Guided Wizard"
              >
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                <span>Guided Wizard</span>
              </button>
            )}

            {/* AI Scope Architect */}
            <button
              type="button"
              onClick={onOpenAiModal}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 transition-all duration-200 active:scale-[0.98]"
              title="Generate customized architectural recommendations"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Scope</span>
            </button>

            {/* Templates Preset */}
            <button
              type="button"
              onClick={onOpenPresetModal}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 transition-all duration-200 active:scale-[0.98]"
              title="Load industry presets"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Presets</span>
            </button>

            {/* Verified Prospect Badge */}
            {leadProfile && (
              <div className="hidden xl:flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-2.5 py-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-semibold truncate max-w-[130px]">{leadProfile.company || leadProfile.fullName}</span>
              </div>
            )}

            {/* Location Benchmark Dropdown */}
            <div className="flex items-center space-x-1.5 bg-slate-800 border border-slate-700/50 rounded-lg px-2.5 py-1">
              <Globe2 className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={regionId}
                onChange={(e) => setRegionId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-100 focus:outline-none cursor-pointer pr-1"
                title="Select location rate benchmark"
              >
                {REGIONS.map((r) => (
                  <option key={r.id} value={r.id} className="bg-slate-900 text-slate-100">
                    {r.flag} {r.name} ({(r.rateMultiplier * 100).toFixed(0)}%)
                  </option>
                ))}
              </select>
            </div>

            {/* Currency Selector */}
            <div className="flex items-center space-x-1.5 bg-slate-800 border border-slate-700/50 rounded-lg px-2.5 py-1">
              <Coins className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={currency.code}
                onChange={(e) => {
                  const found = CURRENCIES.find((c) => c.code === e.target.value);
                  if (found) setCurrency(found);
                }}
                className="bg-transparent text-xs font-semibold text-slate-100 focus:outline-none cursor-pointer"
                title="Select display currency"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code} className="bg-slate-900 text-slate-100">
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
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-all duration-200 active:scale-[0.98]"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Export SOW Button */}
            {showStudioTabs && (
              <button
                type="button"
                onClick={onOpenExportModal}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20 transition-all duration-200 active:scale-[0.98]"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export SOW</span>
              </button>
            )}
          </div>
        </div>

        {/* View Navigation Tabs (Flat Minimalism) */}
        {showStudioTabs && (
          <div className="flex items-center space-x-2 border-t border-slate-800 pt-1 -mb-px overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setViewMode('combined')}
              className={`flex items-center space-x-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all duration-200 active:scale-[0.98] whitespace-nowrap ${
                viewMode === 'combined'
                  ? 'border-indigo-500 text-slate-100'
                  : 'border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Executive Studio</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('parameters')}
              className={`flex items-center space-x-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all duration-200 active:scale-[0.98] whitespace-nowrap ${
                viewMode === 'parameters'
                  ? 'border-indigo-500 text-slate-100'
                  : 'border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>1. Scope Parameters</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('team')}
              className={`flex items-center space-x-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all duration-200 active:scale-[0.98] whitespace-nowrap ${
                viewMode === 'team'
                  ? 'border-indigo-500 text-slate-100'
                  : 'border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>2. Team Squad</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('comparison')}
              className={`flex items-center space-x-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all duration-200 active:scale-[0.98] whitespace-nowrap ${
                viewMode === 'comparison'
                  ? 'border-indigo-500 text-slate-100'
                  : 'border-slate-800 text-slate-500 hover:text-slate-300'
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
