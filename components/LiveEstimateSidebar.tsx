'use client';

import React from 'react';
import { ProjectState, EstimateResult } from '@/types/estimator';
import { REGIONS } from '@/lib/estimator-data';
import {
  Sparkles,
  FileText,
  Clock,
  Users,
  Layers,
  Lock,
  BookmarkPlus,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';

interface LiveEstimateSidebarProps {
  state: ProjectState;
  estimate: EstimateResult;
  currencySymbol: string;
  exchangeRate: number;
  isUnlocked: boolean;
  onOpenAiModal: () => void;
  onOpenExportModal: () => void;
  onOpenPresetModal: () => void;
}

export const LiveEstimateSidebar: React.FC<LiveEstimateSidebarProps> = ({
  state,
  estimate,
  currencySymbol,
  exchangeRate,
  isUnlocked,
  onOpenAiModal,
  onOpenExportModal,
  onOpenPresetModal
}) => {
  const convertedGrandTotal = Math.round(estimate.grandTotalCost * exchangeRate);
  const convertedMonthlyBurn = Math.round(estimate.teamMonthlyBurnRate * exchangeRate);
  const convertedSaasMonthly = Math.round(estimate.monthlySaaSCost * exchangeRate);
  const totalHeadcount = state.team.reduce((acc, m) => acc + m.count, 0);
  const region = REGIONS.find((r) => r.id === state.regionId) || REGIONS[0];

  return (
    <aside className="hidden lg:flex lg:flex-col w-80 xl:w-96 flex-shrink-0 sticky top-0 h-screen bg-slate-800/40 backdrop-blur-md border-l border-slate-700/50 shadow-2xl overflow-y-auto no-scrollbar">
      <div className="p-6 flex flex-col justify-between min-h-full space-y-6">
        <div className="space-y-6">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-700/50">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block">
                Live Telemetry
              </span>
              <h2 className="text-base font-bold text-slate-100 tracking-tight">
                Real-Time Estimate
              </h2>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/50 text-xs font-semibold text-slate-300">
              {region.flag} {Math.round(region.rateMultiplier * 100)}%
            </span>
          </div>

          {/* Primary Cost Readout */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-700/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">
                Total Est. Investment
              </span>
              {!isUnlocked && (
                <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-indigo-400">
                  <Lock className="w-3 h-3" />
                  <span>Step 4 Unlocks SOW</span>
                </span>
              )}
            </div>

            {isUnlocked ? (
              <>
                <div className="text-3xl xl:text-4xl font-black text-emerald-500 tracking-tight">
                  {currencySymbol}{convertedGrandTotal.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400">
                  Range: {currencySymbol}{Math.round(convertedGrandTotal * 0.92).toLocaleString()} – {currencySymbol}{Math.round(convertedGrandTotal * 1.12).toLocaleString()}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2 text-2xl font-black text-slate-400 tracking-tight select-none">
                  <Lock className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                  <span>{currencySymbol} ••,•••</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Submit Step 4 lead form to unlock exact cost & SOW
                </div>
              </>
            )}
          </div>

          {/* Core Numerical Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-400">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                <span>Total Effort</span>
              </div>
              <div className="text-lg font-extrabold text-emerald-500 mt-1">
                {estimate.totalHours.toLocaleString()} hrs
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {state.selectedFeatureIds.length} active modules
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-400">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Timeline</span>
              </div>
              <div className="text-lg font-extrabold text-slate-100 mt-1">
                {estimate.estimatedTimelineWeeks} Weeks
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                ~{estimate.estimatedTimelineMonths} calendar mos
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-400">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Monthly Burn</span>
              </div>
              {isUnlocked ? (
                <div className="text-base font-extrabold text-emerald-500 mt-1">
                  {currencySymbol}{convertedMonthlyBurn.toLocaleString()}
                </div>
              ) : (
                <div className="text-base font-extrabold text-slate-400 mt-1 flex items-center space-x-1.5 select-none">
                  <Lock className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                  <span>Locked</span>
                </div>
              )}
              <div className="text-[10px] text-slate-500 mt-0.5">
                {totalHeadcount} squad specialists
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-400">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Cloud Infra</span>
              </div>
              {isUnlocked ? (
                <div className="text-base font-extrabold text-emerald-500 mt-1">
                  {currencySymbol}{convertedSaasMonthly.toLocaleString()}/mo
                </div>
              ) : (
                <div className="text-base font-extrabold text-slate-400 mt-1 flex items-center space-x-1.5 select-none">
                  <Lock className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                  <span>Locked</span>
                </div>
              )}
              <div className="text-[10px] text-slate-500 mt-0.5">
                {state.selectedSaaSAddons.length} SaaS services
              </div>
            </div>
          </div>

          {/* Architecture Summary */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2.5 text-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Architecture Spec
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Platforms</span>
              <span className="font-semibold text-slate-100 uppercase">
                {state.platforms.join(', ') || 'WEB'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Complexity</span>
              <span className="font-semibold text-slate-100 capitalize">
                {state.complexity}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">UI/UX Fidelity</span>
              <span className="font-semibold text-slate-100 capitalize">
                {state.designLevel.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Risk Buffer</span>
              <span className="font-semibold text-emerald-500">
                +{state.contingencyBufferPercent}%
              </span>
            </div>
          </div>

          {/* Phase Cost Preview */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span>Phase Distribution</span>
              <span className="text-emerald-500">{estimate.totalHours}h</span>
            </div>
            <div className="space-y-2">
              {estimate.phaseBreakdown.map((phase) => (
                <div key={phase.phase} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300 truncate pr-2">
                      {phase.phase.replace(/^\d+\.\s*/, '')}
                    </span>
                    {isUnlocked ? (
                      <span className="font-bold text-emerald-500 flex-shrink-0">
                        {currencySymbol}{Math.round(phase.cost * exchangeRate).toLocaleString()}
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 font-semibold text-slate-400 flex-shrink-0 select-none">
                        <Lock className="w-3 h-3 text-indigo-400" />
                        <span>Locked</span>
                      </span>
                    )}
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                      style={{ width: `${phase.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky Sidebar Actions */}
        <div className="pt-4 border-t border-slate-700/50 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onOpenAiModal}
              className="inline-flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 transition-all duration-200 active:scale-[0.98]"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Scope</span>
            </button>
            <button
              type="button"
              onClick={onOpenPresetModal}
              className="inline-flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 transition-all duration-200 active:scale-[0.98]"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-indigo-400" />
              <span>Presets</span>
            </button>
          </div>

          {isUnlocked ? (
            <button
              type="button"
              onClick={onOpenExportModal}
              className="w-full inline-flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all duration-200 active:scale-[0.98]"
            >
              <FileText className="w-4 h-4" />
              <span>Export Formal SOW</span>
            </button>
          ) : (
            <div className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
              <span>Complete Wizard to Export SOW</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
