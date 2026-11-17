'use client';

import React from 'react';
import { ProjectState, EstimateResult } from '@/types/estimator';
import { CostCharts } from './CostCharts';
import { GanttTimelineBreakdown } from './GanttTimelineBreakdown';
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
  ArrowRight
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
      {/* 1. Executive Investment Summary Card (LegacyBridge Deep Forest Anchor) */}
      <div className="bg-[#082A1C] text-white border border-[#16422F] rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#CDFF8C] mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-[#CDFF8C]" />
              <span>ScopeCraft Executive Scope Breakdown</span>
            </div>

            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-semibold text-[#CDFF8C] tracking-tight tabular-nums lb-heading">
                {currencySymbol}{convertedGrandTotal.toLocaleString()}
              </span>
              <span className="text-xs font-medium text-[#94A3B8] tabular-nums">
                (Est. Range: {currencySymbol}{Math.round(convertedGrandTotal * 0.92).toLocaleString()} – {currencySymbol}{Math.round(convertedGrandTotal * 1.12).toLocaleString()})
              </span>
            </div>

            <p className="text-xs text-[#94A3B8] mt-2.5 max-w-xl leading-relaxed">
              Calculated for <strong className="text-white">{state.selectedFeatureIds.length} technical modules</strong> on{' '}
              <strong className="text-white">{state.platforms.join(', ').toUpperCase()}</strong> with a{' '}
              <strong className="text-white">{state.contingencyBufferPercent}% risk buffer</strong>,{' '}
              <strong className="text-white">{state.profitMarginPercent}% agency margin</strong>, and{' '}
              <strong className="text-white">{state.maintenancePeriod.replace('_', ' ')}</strong> post-launch SLA.
            </p>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t lg:border-t-0 lg:border-l border-[#1A4733] pt-4 lg:pt-0 lg:pl-6">
            <div className="bg-[#0F3827] p-3.5 rounded-xl border border-[#1E4F3A]">
              <div className="text-[11px] font-medium text-[#94A3B8]">Timeline</div>
              <div className="text-base font-semibold text-white flex items-center space-x-1 mt-0.5 tabular-nums">
                <Clock className="w-4 h-4 text-[#CDFF8C]" />
                <span>{estimate.estimatedTimelineWeeks} Weeks</span>
              </div>
              <div className="text-[10px] text-[#94A3B8] tabular-nums">~{estimate.estimatedTimelineMonths} Months</div>
            </div>

            <div className="bg-[#0F3827] p-3.5 rounded-xl border border-[#1E4F3A]">
              <div className="text-[11px] font-medium text-[#94A3B8]">Dev Effort</div>
              <div className="text-base font-semibold text-[#CDFF8C] flex items-center space-x-1 mt-0.5 tabular-nums">
                <Zap className="w-4 h-4 text-[#CDFF8C]" />
                <span>{estimate.totalHours} hrs</span>
              </div>
              <div className="text-[10px] text-[#94A3B8] tabular-nums">{state.selectedFeatureIds.length} Modules</div>
            </div>

            <div className="bg-[#0F3827] p-3.5 rounded-xl border border-[#1E4F3A]">
              <div className="text-[11px] font-medium text-[#94A3B8]">Monthly Burn</div>
              <div className="text-base font-semibold text-[#CDFF8C] flex items-center space-x-1 mt-0.5 tabular-nums">
                <DollarSign className="w-4 h-4 text-[#CDFF8C]" />
                <span>{currencySymbol}{convertedMonthlyBurn.toLocaleString()}</span>
              </div>
              <div className="text-[10px] text-[#94A3B8] font-medium truncate">
                {region.flag} {region.name}
              </div>
            </div>

            <div className="bg-[#0F3827] p-3.5 rounded-xl border border-[#1E4F3A]">
              <div className="text-[11px] font-medium text-[#94A3B8]">Engineering Squad</div>
              <div className="text-base font-semibold text-white flex items-center space-x-1 mt-0.5 tabular-nums">
                <Users className="w-4 h-4 text-[#CDFF8C]" />
                <span>{estimate.recommendedTeam.reduce((acc, m) => acc + m.count, 0)} Roles</span>
              </div>
              <div className="text-[10px] text-[#CDFF8C] font-semibold tabular-nums">
                @{currencySymbol}{Math.round(estimate.effectiveHourlyRate * exchangeRate)}/hr avg
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Timeline Target & Velocity Synchronization Gauge */}
      <div className="bg-[#F4F7F9] p-6 rounded-2xl border border-[#DDE3E7] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-[#082A1C] text-sm flex items-center space-x-2 lb-heading">
              <Clock className="w-4 h-4 text-[#082A1C]" />
              <span>Team Velocity & Delivery Schedule Synchronization</span>
            </h3>
            <p className="text-xs text-[#64707A]">
              Align your target delivery milestone with your allocated engineering headcount.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAutoSyncTeam}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold lb-btn-primary active:scale-[0.98] whitespace-nowrap shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Auto-Optimize Team to Scope</span>
          </button>
        </div>

        {/* Timeline Target Slider */}
        <div className="space-y-2 bg-white p-4 rounded-xl border border-[#DDE3E7]">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-[#082A1C]">Target Launch Goal:</span>
            <span className="text-[#082A1C] font-bold tabular-nums">
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
            className="w-full accent-[#082A1C] cursor-pointer"
          />
        </div>

        {/* Velocity Status Banner */}
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            estimate.velocityStatus === 'understaffed'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : estimate.velocityStatus === 'accelerated'
              ? 'bg-[#F4F7F9] border-[#082A1C]/20 text-[#082A1C]'
              : 'bg-[#CDFF8C]/40 border-[#082A1C]/15 text-[#082A1C]'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {estimate.velocityStatus === 'understaffed' ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-[#082A1C] flex-shrink-0" />
            )}
            <div>
              <span className="font-semibold">
                {estimate.velocityStatus === 'understaffed' && 'Understaffed for Target Deadline'}
                {estimate.velocityStatus === 'accelerated' && 'Fast-Track Accelerated Sprint Team'}
                {estimate.velocityStatus === 'balanced' && 'Optimal Team Velocity Synchronization'}
              </span>
              <p className="text-[11px] text-[#64707A] mt-0.5">
                Current team throughput delivers project in <strong className="font-semibold text-[#082A1C]">{estimate.estimatedTimelineWeeks} weeks</strong>.
                {estimate.velocityStatus === 'understaffed' && ' Consider adding 1-2 engineers or extending target timeline.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenExportModal}
            className="hidden sm:inline-flex items-center space-x-1 font-semibold text-xs text-[#082A1C] hover:underline underline-offset-4 flex-shrink-0 ml-2 transition-all duration-200 active:scale-[0.98]"
          >
            <span>Generate SOW</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Engineering Timeline & Module Phase GANTT Breakdown */}
      <GanttTimelineBreakdown
        state={state}
        estimate={estimate}
        currencySymbol={currencySymbol}
        exchangeRate={exchangeRate}
      />

      {/* 4. Scope & Team Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Active Scope */}
        <div className="bg-[#F4F7F9] p-6 rounded-2xl border border-[#DDE3E7] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#DDE3E7]">
            <h3 className="font-semibold text-[#082A1C] text-sm flex items-center space-x-2 lb-heading">
              <Layers className="w-4 h-4 text-[#082A1C]" />
              <span>Active Scope Specifications</span>
            </h3>
            <span className="text-xs font-semibold text-[#082A1C] bg-[#CDFF8C] px-2.5 py-0.5 rounded-lg tabular-nums">
              {state.selectedFeatureIds.length} Features
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#64707A]">Platforms:</span>
              <span className="font-semibold text-[#082A1C]">
                {state.platforms.join(', ').toUpperCase() || 'Web'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#64707A]">Complexity Tier:</span>
              <span className="font-semibold text-[#082A1C] capitalize">
                {state.complexity}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#64707A]">UI/UX Polish:</span>
              <span className="font-semibold text-[#082A1C] capitalize">
                {state.designLevel.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#64707A]">QA & Security:</span>
              <span className="font-semibold text-[#082A1C] capitalize">
                {state.qaLevel.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-[#DDE3E7]">
            <span className="text-[11px] font-semibold text-[#64707A] uppercase tracking-wider block mb-2">
              Included Feature Modules:
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
              {state.selectedFeatureIds.map((fId) => {
                const feat = FEATURE_CATALOG.find((f) => f.id === fId);
                return (
                  <span
                    key={fId}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white text-[#082A1C] border border-[#DDE3E7]"
                  >
                    {feat ? feat.name : fId}{' '}
                    <span className="text-[#64707A] tabular-nums">({feat?.baseHours}h)</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Active Squad */}
        <div className="bg-[#F4F7F9] p-6 rounded-2xl border border-[#DDE3E7] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#DDE3E7]">
            <h3 className="font-semibold text-[#082A1C] text-sm flex items-center space-x-2 lb-heading">
              <Users className="w-4 h-4 text-[#082A1C]" />
              <span>Active Engineering Squad</span>
            </h3>
            <span className="text-xs font-semibold text-[#082A1C] bg-white px-2.5 py-0.5 rounded-lg border border-[#DDE3E7]">
              {region.flag} {region.name}
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#64707A]">Squad Size:</span>
              <span className="font-semibold text-[#082A1C] tabular-nums">
                {state.team.reduce((sum, m) => sum + m.count, 0)} Total Members
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#64707A]">Monthly Capacity:</span>
              <span className="font-semibold text-[#082A1C] tabular-nums">
                {estimate.teamTotalMonthlyCapacityHours} Hours / mo
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#64707A]">Monthly Labor Burn:</span>
              <span className="font-bold text-[#082A1C] tabular-nums">
                {currencySymbol}{convertedMonthlyBurn.toLocaleString()}/mo
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-[#DDE3E7]">
            <span className="text-[11px] font-semibold text-[#64707A] uppercase tracking-wider block mb-2">
              Assigned Team Roles:
            </span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs">
              {state.team.map((m) => {
                const role = TEAM_ROLES.find((r) => r.id === m.roleId);
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#DDE3E7] text-[11px]"
                  >
                    <span className="font-semibold text-[#082A1C]">
                      {m.count}x {role?.title || m.roleId}
                    </span>
                    <span className="text-[10px] text-[#64707A] capitalize">
                      {m.experienceLevel} · {m.engagement.replace('_', ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Visual Cost Charts */}
      <CostCharts estimate={estimate} currencySymbol={currencySymbol} exchangeRate={exchangeRate} />
    </div>
  );
};
