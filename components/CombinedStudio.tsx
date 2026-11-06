'use client';

import React from 'react';
import { ProjectState, EstimateResult } from '@/types/estimator';
import { CostCharts } from './CostCharts';
import { FEATURE_CATALOG, TEAM_ROLES, REGIONS } from '@/lib/estimator-data';
import { generateRecommendedTeam } from '@/lib/estimator-engine';
import {
  DollarSign,
  Clock,
  Zap,
  Users,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

interface CombinedStudioProps {
  state: ProjectState;
  estimate: EstimateResult;
  onChange: (updated: Partial<ProjectState>) => void;
  currencySymbol: string;
  exchangeRate: number;
  onOpenExportModal: () => void;
}

export const CombinedStudio: React.FC<CombinedStudioProps> = ({
  state,
  estimate,
  onChange,
  currencySymbol,
  exchangeRate,
  onOpenExportModal
}) => {
  const convertedGrandTotal = Math.round(estimate.grandTotalCost * exchangeRate);
  const convertedBaseLabor = Math.round(estimate.baseLaborCost * exchangeRate);
  const convertedMonthlyBurn = Math.round(estimate.teamMonthlyBurnRate * exchangeRate);
  const region = REGIONS.find((r) => r.id === state.regionId) || REGIONS[0];

  const handleAutoSyncTeam = () => {
    const recommended = generateRecommendedTeam(
      state.selectedFeatureIds,
      state.platforms,
      state.complexity,
      state.designLevel
    );
    onChange({ team: recommended });
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Executive Investment Summary Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>ScopeCraft Executive Scope Breakdown</span>
            </div>
            
            <div className="flex items-baseline space-x-3">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                {currencySymbol}{convertedGrandTotal.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                (Est. Range: {currencySymbol}{Math.round(convertedGrandTotal * 0.92).toLocaleString()} – {currencySymbol}{Math.round(convertedGrandTotal * 1.12).toLocaleString()})
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-2 max-w-xl leading-relaxed">
              Calculated for <strong>{state.selectedFeatureIds.length} technical modules</strong> on <strong>{state.platforms.join(', ').toUpperCase()}</strong> with a <strong>{state.contingencyBufferPercent}% risk buffer</strong>, <strong>{state.profitMarginPercent}% agency margin</strong>, and <strong>{state.maintenancePeriod.replace('_', ' ')}</strong> post-launch SLA.
            </p>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t lg:border-t-0 lg:border-l border-slate-200 pt-4 lg:pt-0 lg:pl-6">
            
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="text-[11px] font-semibold text-slate-500">Timeline</div>
              <div className="text-base font-bold text-slate-900 flex items-center space-x-1 mt-0.5">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>{estimate.estimatedTimelineWeeks} Weeks</span>
              </div>
              <div className="text-[10px] text-slate-400">~{estimate.estimatedTimelineMonths} Months</div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="text-[11px] font-semibold text-slate-500">Dev Effort</div>
              <div className="text-base font-bold text-slate-900 flex items-center space-x-1 mt-0.5">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>{estimate.totalHours} hrs</span>
              </div>
              <div className="text-[10px] text-slate-400">{state.selectedFeatureIds.length} Modules</div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="text-[11px] font-semibold text-slate-500">Monthly Burn</div>
              <div className="text-base font-bold text-emerald-700 flex items-center space-x-1 mt-0.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>{currencySymbol}{convertedMonthlyBurn.toLocaleString()}</span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                {region.flag} {region.name}
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="text-[11px] font-semibold text-slate-500">Engineering Squad</div>
              <div className="text-base font-bold text-slate-900 flex items-center space-x-1 mt-0.5">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>{estimate.recommendedTeam.reduce((acc, m) => acc + m.count, 0)} Roles</span>
              </div>
              <div className="text-[10px] text-slate-400">@{currencySymbol}{Math.round(estimate.effectiveHourlyRate * exchangeRate)}/hr avg</div>
            </div>

          </div>

        </div>
      </div>

      {/* 2. Timeline Target & Velocity Synchronization Gauge */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Team Velocity & Delivery Schedule Synchronization</span>
            </h3>
            <p className="text-xs text-slate-500">
              Align your target delivery milestone with your allocated engineering headcount.
            </p>
          </div>

          <button
            onClick={handleAutoSyncTeam}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Auto-Optimize Team to Scope</span>
          </button>
        </div>

        {/* Timeline Target Slider */}
        <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-700">Target Launch Goal:</span>
            <span className="text-blue-700 font-bold">
              {state.targetTimelineWeeks} Weeks (~{(state.targetTimelineWeeks / 4.33).toFixed(1)} Months)
            </span>
          </div>
          <input
            type="range"
            min={4}
            max={36}
            step={2}
            value={state.targetTimelineWeeks}
            onChange={(e) => onChange({ targetTimelineWeeks: Number(e.target.value) })}
            className="w-full accent-blue-600 cursor-pointer"
          />
        </div>

        {/* Velocity Status Banner */}
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            estimate.velocityStatus === 'understaffed'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : estimate.velocityStatus === 'accelerated'
              ? 'bg-blue-50 border-blue-200 text-blue-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {estimate.velocityStatus === 'understaffed' ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            )}
            <div>
              <span className="font-bold">
                {estimate.velocityStatus === 'understaffed' && 'Understaffed for Target Deadline'}
                {estimate.velocityStatus === 'accelerated' && 'Fast-Track Accelerated Sprint Team'}
                {estimate.velocityStatus === 'balanced' && 'Optimal Team Velocity Synchronization'}
              </span>
              <p className="text-[11px] opacity-90 mt-0.5">
                Current team throughput delivers project in <strong className="font-semibold">{estimate.estimatedTimelineWeeks} weeks</strong>. 
                {estimate.velocityStatus === 'understaffed' && ' Consider adding 1-2 engineers or extending target timeline.'}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenExportModal}
            className="hidden sm:inline-flex items-center space-x-1 font-bold text-[11px] underline underline-offset-2 flex-shrink-0 ml-2"
          >
            <span>Generate SOW</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Scope & Team Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left: Active Scope */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Active Scope Specifications</span>
            </h3>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              {state.selectedFeatureIds.length} Features
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Platforms:</span>
              <span className="font-semibold text-slate-800">
                {state.platforms.join(', ').toUpperCase() || 'Web'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Complexity Tier:</span>
              <span className="font-semibold text-slate-800 capitalize">
                {state.complexity}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">UI/UX Polish:</span>
              <span className="font-semibold text-slate-800 capitalize">
                {state.designLevel.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">QA & Security:</span>
              <span className="font-semibold text-slate-800 capitalize">
                {state.qaLevel.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Included Feature Modules:
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
              {state.selectedFeatureIds.map((fId) => {
                const feat = FEATURE_CATALOG.find((f) => f.id === fId);
                return (
                  <span
                    key={fId}
                    className="px-2 py-1 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    {feat ? feat.name : fId} ({feat?.baseHours}h)
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Active Squad */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Active Engineering Squad</span>
            </h3>
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              {region.flag} {region.name}
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Squad Size:</span>
              <span className="font-semibold text-slate-800">
                {state.team.reduce((sum, m) => sum + m.count, 0)} Total Members
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Monthly Capacity:</span>
              <span className="font-semibold text-slate-800">
                {estimate.teamTotalMonthlyCapacityHours} Hours / mo
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Monthly Labor Burn:</span>
              <span className="font-bold text-emerald-700">
                {currencySymbol}{convertedMonthlyBurn.toLocaleString()}/mo
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Assigned Team Roles:
            </span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs">
              {state.team.map((m) => {
                const role = TEAM_ROLES.find((r) => r.id === m.roleId);
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px]"
                  >
                    <span className="font-semibold text-slate-800">
                      {m.count}x {role?.title || m.roleId}
                    </span>
                    <span className="text-[10px] text-slate-500 capitalize">
                      {m.experienceLevel} • {m.engagement.replace('_', ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* 4. Visual Cost Charts */}
      <CostCharts estimate={estimate} currencySymbol={currencySymbol} exchangeRate={exchangeRate} />

    </div>
  );
};
