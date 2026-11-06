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
  CheckCircle2,
  Building2
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
  leadProfile
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Tier: Branding, Project Title, and Key Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between py-3.5 gap-4">
          
          {/* Brand & Project Identity */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-sm tracking-tight">ScopeCraft</span>
                <span className="text-slate-300">/</span>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => onChangeProjectName(e.target.value)}
                  className="font-semibold text-sm text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white px-2 py-0.5 rounded-md border border-transparent hover:border-slate-300 focus:border-blue-500 transition focus:outline-none focus:ring-2 focus:ring-blue-100 max-w-[220px] sm:max-w-xs truncate"
                  placeholder="Project Name..."
                  title="Click to rename project"
                />
              </div>
              <p className="text-xs text-slate-500">
                Precision Software Scoping & Architecture Studio
              </p>
            </div>
          </div>

          {/* Action Tools & Dropdowns */}
          <div className="flex items-center flex-wrap gap-2.5">
            
            {/* Guided Wizard Launcher */}
            {onOpenWizard && (
              <button
                onClick={onOpenWizard}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition"
                title="Relaunch 4-Step Guided Wizard"
              >
                <Compass className="w-3.5 h-3.5 text-blue-600" />
                <span>Guided Wizard</span>
              </button>
            )}

            {/* AI Scope Architect */}
            <button
              onClick={onOpenAiModal}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition"
              title="Generate customized architectural recommendations"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>AI Scope</span>
            </button>

            {/* Templates Preset */}
            <button
              onClick={onOpenPresetModal}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition"
              title="Load industry presets"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Presets</span>
            </button>

            {/* Verified Prospect Badge */}
            {leadProfile && (
              <div className="hidden xl:flex items-center space-x-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-semibold truncate max-w-[130px]">{leadProfile.company || leadProfile.fullName}</span>
              </div>
            )}

            {/* Location Benchmark Dropdown */}
            <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 shadow-2xs">
              <Globe2 className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={regionId}
                onChange={(e) => setRegionId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1"
                title="Select location rate benchmark"
              >
                {REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.flag} {r.name} ({(r.rateMultiplier * 100).toFixed(0)}%)
                  </option>
                ))}
              </select>
            </div>

            {/* Currency Selector */}
            <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 shadow-2xs">
              <Coins className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={currency.code}
                onChange={(e) => {
                  const found = CURRENCIES.find((c) => c.code === e.target.value);
                  if (found) setCurrency(found);
                }}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                title="Select display currency"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} {c.code}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Defaults */}
            <button
              onClick={onReset}
              title="Reset to Default SaaS MVP"
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Export SOW Button */}
            <button
              onClick={onOpenExportModal}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export SOW</span>
            </button>

          </div>
        </div>

        {/* View Navigation Tabs */}
        <div className="flex items-center space-x-1 border-t border-slate-200 pt-1 -mb-px overflow-x-auto no-scrollbar">
          
          <button
            onClick={() => setViewMode('combined')}
            className={`flex items-center space-x-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              viewMode === 'combined'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Executive Studio</span>
            <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-700 rounded-md font-bold">
              Full View
            </span>
          </button>

          <button
            onClick={() => setViewMode('parameters')}
            className={`flex items-center space-x-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              viewMode === 'parameters'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>1. Scope Parameters</span>
          </button>

          <button
            onClick={() => setViewMode('team')}
            className={`flex items-center space-x-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              viewMode === 'team'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>2. Team Squad</span>
          </button>

          <button
            onClick={() => setViewMode('comparison')}
            className={`flex items-center space-x-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              viewMode === 'comparison'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>3. Scenario Comparison</span>
          </button>

        </div>
      </div>
    </header>
  );
};
