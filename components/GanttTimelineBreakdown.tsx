'use client';

import React, { useState, useMemo } from 'react';
import { ProjectState, EstimateResult, FeatureItem } from '@/types/estimator';
import { FEATURE_CATALOG, TEAM_ROLES } from '@/lib/estimator-data';
import {
  Calendar,
  Clock,
  Flag,
  CheckCircle2,
  Users,
  ChevronRight,
  Zap,
  ChevronDown
} from 'lucide-react';

interface GanttTimelineBreakdownProps {
  state: ProjectState;
  estimate: EstimateResult;
  currencySymbol: string;
  exchangeRate: number;
}

type ViewMode = 'phases' | 'modules' | 'critical_path';

interface ScheduledModule {
  feature: FeatureItem;
  phaseId: number;
  phaseName: string;
  phaseColor: {
    bar: string;
    light: string;
    text: string;
    border: string;
    hover: string;
  };
  startWeek: number;
  durationWeeks: number;
  endWeek: number;
  adjustedHours: number;
  estimatedCost: number;
  roles: string[];
  deliverable: string;
  isCriticalPath: boolean;
}

const PHASE_THEMES: Record<number, { bar: string; light: string; text: string; border: string; hover: string }> = {
  1: {
    bar: 'bg-indigo-600',
    light: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
    hover: 'hover:bg-indigo-500'
  },
  2: {
    bar: 'bg-sky-600',
    light: 'bg-sky-500/10',
    text: 'text-sky-400',
    border: 'border-sky-500/30',
    hover: 'hover:bg-sky-500'
  },
  3: {
    bar: 'bg-indigo-500',
    light: 'bg-indigo-500/10',
    text: 'text-indigo-300',
    border: 'border-indigo-500/30',
    hover: 'hover:bg-indigo-400'
  },
  4: {
    bar: 'bg-violet-600',
    light: 'bg-violet-500/10',
    text: 'text-violet-400',
    border: 'border-violet-500/30',
    hover: 'hover:bg-violet-500'
  },
  5: {
    bar: 'bg-emerald-600',
    light: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    hover: 'hover:bg-emerald-500'
  }
};

export const GanttTimelineBreakdown: React.FC<GanttTimelineBreakdownProps> = ({
  state,
  estimate,
  currencySymbol,
  exchangeRate
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('phases');
  const [hoveredModuleId, setHoveredModuleId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [expandedPhaseIds, setExpandedPhaseIds] = useState<number[]>([1, 2, 3, 4, 5]);

  const totalWeeks = Math.max(4, estimate.estimatedTimelineWeeks || state.targetTimelineWeeks || 12);

  const scheduledModules: ScheduledModule[] = useMemo(() => {
    const selectedFeatures = FEATURE_CATALOG.filter((f) =>
      state.selectedFeatureIds.includes(f.id)
    );

    if (selectedFeatures.length === 0) {
      return [];
    }

    let complexityMultiplier = 1.0;
    if (state.complexity === 'mvp') complexityMultiplier = 0.9;
    if (state.complexity === 'standard') complexityMultiplier = 1.18;
    if (state.complexity === 'enterprise') complexityMultiplier = 1.55;

    const pCount = state.platforms.length;
    const platformMultiplier = pCount >= 3 ? 1.8 : pCount === 2 ? 1.45 : 1.0;

    return selectedFeatures.map((feat, index) => {
      let phaseId = 3;
      let phaseName = 'Core Sprint Development';
      let deliverable = 'Functional API endpoints, data models & integration tests.';
      let baseStartFraction = 0.25;
      let isCriticalPath = false;

      switch (feat.category) {
        case 'auth':
        case 'security_compliance':
          phaseId = 1;
          phaseName = 'Discovery & Technical Architecture';
          deliverable = 'Authentication flows, session management & RBAC security rules.';
          baseStartFraction = 0.04;
          isCriticalPath = true;
          break;

        case 'content_cms':
        case 'communication':
          phaseId = 3;
          phaseName = 'Core Sprint Development';
          deliverable = 'Data schemas, backend services, WebSocket channels & UI views.';
          baseStartFraction = 0.22;
          isCriticalPath = index % 2 === 0;
          break;

        case 'monetization':
          phaseId = 3;
          phaseName = 'Core Sprint Development';
          deliverable = 'Payment webhooks, subscription billing ledger & customer portal.';
          baseStartFraction = 0.35;
          isCriticalPath = true;
          break;

        case 'ai_ml':
        case 'analytics_data':
        case 'integrations':
          phaseId = 4;
          phaseName = 'Intelligence & System Integrations';
          deliverable = 'LLM/RAG pipelines, external API webhooks & analytical dashboards.';
          baseStartFraction = 0.45;
          isCriticalPath = false;
          break;

        case 'ui_ux_extras':
          phaseId = 2;
          phaseName = 'UI/UX Prototyping & Design Systems';
          deliverable = 'Design token library, component prototypes & mobile responsive views.';
          baseStartFraction = 0.12;
          break;

        case 'devops_cloud':
          phaseId = 5;
          phaseName = 'Hardening, QA & Cloud Release';
          deliverable = 'Automated CI/CD pipelines, container orchestration & prod rollout.';
          baseStartFraction = 0.72;
          isCriticalPath = true;
          break;

        default:
          phaseId = 3;
          phaseName = 'Core Sprint Development';
          deliverable = 'Feature implementation and sprint verification.';
          baseStartFraction = 0.28;
      }

      const internalStagger = (index % 3) * 0.05;
      const startPercent = Math.min(0.85, baseStartFraction + internalStagger);
      const startWeek = Math.max(1, Math.round(startPercent * totalWeeks * 10) / 10);

      const adjustedHours = Math.round(feat.baseHours * complexityMultiplier * platformMultiplier);
      const minDuration = 1.2;
      const rawDuration = (adjustedHours / (estimate.totalHours || 200)) * (totalWeeks * 1.4);
      const durationWeeks = Math.max(
        minDuration,
        Math.min(totalWeeks - startWeek + 0.5, Math.round(rawDuration * 10) / 10)
      );
      const endWeek = Math.min(totalWeeks, Math.round((startWeek + durationWeeks) * 10) / 10);

      const estimatedCost = Math.round(adjustedHours * (estimate.effectiveHourlyRate * exchangeRate));

      const roles = (feat.recommendedRoles || ['fullstack_dev', 'backend_dev']).map((rId) => {
        const found = TEAM_ROLES.find((r) => r.id === rId);
        return found ? found.title : rId;
      });

      return {
        feature: feat,
        phaseId,
        phaseName,
        phaseColor: PHASE_THEMES[phaseId] || PHASE_THEMES[3],
        startWeek,
        durationWeeks,
        endWeek,
        adjustedHours,
        estimatedCost,
        roles,
        deliverable,
        isCriticalPath
      };
    });
  }, [
    state.selectedFeatureIds,
    state.complexity,
    state.platforms,
    totalWeeks,
    estimate.totalHours,
    estimate.effectiveHourlyRate,
    exchangeRate
  ]);

  const highLevelPhases = useMemo(() => {
    return [
      {
        id: 1,
        name: 'Phase 1: Discovery & System Architecture',
        description: 'Requirements analysis, schema modeling, auth architecture & security baseline.',
        percentage: 14,
        startWeek: 1,
        endWeek: Math.max(2, Math.round(totalWeeks * 0.22)),
        color: PHASE_THEMES[1]
      },
      {
        id: 2,
        name: 'Phase 2: UI/UX Prototyping & Design System',
        description: 'High-fidelity wireframes, responsive component specifications & token freeze.',
        percentage: 18,
        startWeek: Math.max(1.5, Math.round(totalWeeks * 0.12)),
        endWeek: Math.max(3, Math.round(totalWeeks * 0.35)),
        color: PHASE_THEMES[2]
      },
      {
        id: 3,
        name: 'Phase 3: Core Sprint Engineering',
        description: 'Core domain services, database models, payment checkout & real-time messaging.',
        percentage: 42,
        startWeek: Math.max(2.5, Math.round(totalWeeks * 0.25)),
        endWeek: Math.max(5, Math.round(totalWeeks * 0.75)),
        color: PHASE_THEMES[3]
      },
      {
        id: 4,
        name: 'Phase 4: Intelligence, Analytics & Integrations',
        description: 'AI assistants, vector search, external CRM/APIs & analytics dashboards.',
        percentage: 16,
        startWeek: Math.max(4, Math.round(totalWeeks * 0.45)),
        endWeek: Math.max(6, Math.round(totalWeeks * 0.82)),
        color: PHASE_THEMES[4]
      },
      {
        id: 5,
        name: 'Phase 5: QA Hardening, DevOps & Production Launch',
        description: 'Playwright/Cypress automated suites, penetration testing & production deployment.',
        percentage: 10,
        startWeek: Math.max(totalWeeks - 2.5, Math.round(totalWeeks * 0.75)),
        endWeek: totalWeeks,
        color: PHASE_THEMES[5]
      }
    ];
  }, [totalWeeks]);

  const milestones = useMemo(() => {
    return [
      {
        week: 1,
        title: 'Project Kickoff & Tech Alignment',
        description: 'Scoping freeze and development workspace setup.'
      },
      {
        week: Math.max(2, Math.round(totalWeeks * 0.22)),
        title: 'Architecture & UX Signoff',
        description: 'Database schema, auth contracts & Figma design system freeze.'
      },
      {
        week: Math.max(4, Math.round(totalWeeks * 0.55)),
        title: 'Alpha Integration Milestone',
        description: 'Core modules verified in staging with active API contracts.'
      },
      {
        week: Math.max(totalWeeks - 2, Math.round(totalWeeks * 0.82)),
        title: 'Beta & Code Freeze',
        description: 'Security audit, performance tuning & bug bash.'
      },
      {
        week: totalWeeks,
        title: 'Production Go-Live & SLA Handover',
        description: 'Live DNS switchover, production monitoring & maintenance warranty.'
      }
    ];
  }, [totalWeeks]);

  const togglePhaseExpand = (pId: number) => {
    setExpandedPhaseIds((prev) =>
      prev.includes(pId) ? prev.filter((id) => id !== pId) : [...prev, pId]
    );
  };

  const selectedModule = scheduledModules.find((m) => m.feature.id === selectedModuleId);
  const weekNumbers = Array.from({ length: totalWeeks }, (_, i) => i + 1);

  return (
    <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
      {/* 1. Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-700/50">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-400 mb-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>Interactive Delivery Schedule & Phase GANTT</span>
          </div>
          <h3 className="text-lg font-bold text-slate-100 tracking-tight">
            Engineering Timeline & Module Phase Breakdown
          </h3>
          <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
            Dynamic Gantt chart modeling parallel sprint velocities, dependencies, and delivery windows for all{' '}
            <strong className="text-slate-200 font-semibold">{state.selectedFeatureIds.length} scoped modules</strong> across{' '}
            <strong className="text-emerald-500 font-semibold">{totalWeeks} weeks</strong>.
          </p>
        </div>

        {/* View Mode Switcher (Flat Minimalism) */}
        <div className="flex items-center gap-4 border-b border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('phases')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all duration-200 active:scale-[0.98] ${
              viewMode === 'phases'
                ? 'border-indigo-500 text-slate-100'
                : 'border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            Phased Timeline
          </button>
          <button
            type="button"
            onClick={() => setViewMode('modules')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all duration-200 active:scale-[0.98] ${
              viewMode === 'modules'
                ? 'border-indigo-500 text-slate-100'
                : 'border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            Module Sprints ({scheduledModules.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode('critical_path')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all duration-200 active:scale-[0.98] ${
              viewMode === 'critical_path'
                ? 'border-indigo-500 text-slate-100'
                : 'border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            Critical Path
          </button>
        </div>
      </div>

      {/* 2. Timeline Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <div className="text-[11px] font-semibold text-slate-400">Total Delivery Span</div>
          <div className="text-sm font-bold text-slate-100 flex items-center space-x-1.5 mt-0.5">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>{totalWeeks} Calendar Weeks</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            ~{estimate.estimatedTimelineMonths} Months ({Math.ceil(totalWeeks / 2)} Sprints)
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold text-slate-400">Engineering Capacity</div>
          <div className="text-sm font-bold text-slate-100 flex items-center space-x-1.5 mt-0.5">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>{state.team.reduce((sum, m) => sum + m.count, 0)} Active Roles</span>
          </div>
          <div className="text-[10px] text-emerald-500 font-semibold mt-0.5">
            {estimate.teamTotalMonthlyCapacityHours} hrs/mo sprint velocity
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold text-slate-400">Scheduled Scope</div>
          <div className="text-sm font-bold text-slate-100 flex items-center space-x-1.5 mt-0.5">
            <Zap className="w-4 h-4 text-emerald-500" />
            <span>{scheduledModules.length} Technical Modules</span>
          </div>
          <div className="text-[10px] text-emerald-500 font-semibold mt-0.5">
            {estimate.totalHours} total engineering hours
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold text-slate-400">Schedule Target Status</div>
          <div className="text-sm font-bold text-emerald-500 flex items-center space-x-1.5 mt-0.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="capitalize">{estimate.velocityStatus}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Target: {state.targetTimelineWeeks}w vs Projected: {estimate.estimatedTimelineWeeks}w
          </div>
        </div>
      </div>

      {/* 3. Gantt Chart Canvas */}
      <div className="space-y-4">
        {/* Milestone Flags Bar */}
        <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-2.5">
            <span className="flex items-center space-x-1.5">
              <Flag className="w-3.5 h-3.5 text-indigo-400" />
              <span>Key Delivery Milestones & Quality Gates</span>
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              5 Primary Releases
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
            {milestones.map((m, idx) => (
              <div
                key={idx}
                className="bg-slate-800/70 p-2.5 rounded-lg border border-slate-700/50 text-[11px]"
              >
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="font-bold text-indigo-400">Week {m.week}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900/80 text-slate-400 font-medium border border-slate-700/50">
                    M{idx + 1}
                  </span>
                </div>
                <div className="font-bold text-slate-100 leading-snug line-clamp-1">{m.title}</div>
                <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{m.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Gantt Timeline Table */}
        <div className="overflow-x-auto border border-slate-700/50 rounded-xl bg-slate-900/60">
          <div className="min-w-[760px]">
            {/* Timeline Header Ruler */}
            <div className="grid grid-cols-12 bg-slate-800/80 border-b border-slate-700/50 text-slate-200 text-xs font-bold divide-x divide-slate-800">
              <div className="col-span-4 p-3 flex items-center justify-between">
                <span>Phase & Module Specification</span>
                <span className="text-[11px] font-semibold text-slate-400">Duration</span>
              </div>
              <div className="col-span-8 p-3 flex items-center justify-between relative">
                <span className="text-slate-300 font-semibold text-[11px]">
                  Sprint Timeline (Weeks 1 to {totalWeeks})
                </span>
                <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-medium">
                  <span className="inline-block w-2 h-2 rounded-full bg-indigo-500"></span>
                  <span>Active Sprint</span>
                </div>
              </div>
            </div>

            {/* Week Columns Bar Indicator */}
            <div className="grid grid-cols-12 bg-slate-900/80 border-b border-slate-800 text-[10px] font-semibold text-slate-400 divide-x divide-slate-800">
              <div className="col-span-4 px-3 py-1.5 flex items-center justify-between text-slate-500">
                <span>Workstream Item</span>
                <span>Effort (Hrs)</span>
              </div>
              <div className="col-span-8 px-2 py-1.5 flex items-center justify-between">
                {weekNumbers.map((w) => (
                  <div key={w} className="flex-1 text-center font-mono">
                    W{w}
                  </div>
                ))}
              </div>
            </div>

            {/* GANTT VIEW 1: PHASE BREAKDOWN WITH NESTED MODULES */}
            {viewMode === 'phases' && (
              <div className="divide-y divide-slate-800">
                {highLevelPhases.map((phase) => {
                  const phaseModules = scheduledModules.filter((m) => m.phaseId === phase.id);
                  const isExpanded = expandedPhaseIds.includes(phase.id);
                  const phaseStartPct = ((phase.startWeek - 1) / totalWeeks) * 100;
                  const phaseWidthPct = Math.max(
                    8,
                    ((phase.endWeek - phase.startWeek + 0.8) / totalWeeks) * 100
                  );

                  return (
                    <div key={phase.id} className="hover:bg-slate-800/30 transition-all duration-200">
                      {/* Main Phase Row */}
                      <div className="grid grid-cols-12 items-center p-3 divide-x divide-slate-800">
                        <div className="col-span-4 pr-3">
                          <button
                            type="button"
                            onClick={() => togglePhaseExpand(phase.id)}
                            className="flex items-center space-x-2 text-left w-full group transition-all duration-200 active:scale-[0.98]"
                          >
                            <span className="p-0.5 rounded text-slate-400 group-hover:text-slate-100 transition-all duration-200">
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </span>
                            <div>
                              <div className="font-bold text-xs text-slate-100 group-hover:text-indigo-400 transition-all duration-200 flex items-center space-x-1.5">
                                <span>{phase.name}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 line-clamp-1">
                                {phase.description}
                              </div>
                            </div>
                          </button>
                        </div>

                        {/* Phase Bar Track */}
                        <div className="col-span-8 pl-3 pr-2 py-1 relative h-9 flex items-center">
                          <div className="absolute inset-0 flex divide-x divide-slate-800 pointer-events-none">
                            {weekNumbers.map((w) => (
                              <div key={w} className="flex-1 h-full"></div>
                            ))}
                          </div>

                          <div
                            style={{
                              left: `${phaseStartPct}%`,
                              width: `${phaseWidthPct}%`
                            }}
                            className={`relative h-6 rounded-lg ${phase.color.bar} text-white shadow-sm flex items-center justify-between px-2.5 text-[10px] font-bold z-10 transition-all duration-200 hover:brightness-110`}
                          >
                            <span className="truncate">W{phase.startWeek} – W{phase.endWeek}</span>
                            <span className="opacity-90">{phase.percentage}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Nested Modules */}
                      {isExpanded && phaseModules.length > 0 && (
                        <div className="bg-slate-900/50 divide-y divide-slate-800/80">
                          {phaseModules.map((item) => {
                            const modStartPct = ((item.startWeek - 1) / totalWeeks) * 100;
                            const modWidthPct = Math.max(5, (item.durationWeeks / totalWeeks) * 100);
                            const isHovered = hoveredModuleId === item.feature.id;
                            const isSelected = selectedModuleId === item.feature.id;

                            return (
                              <div
                                key={item.feature.id}
                                onMouseEnter={() => setHoveredModuleId(item.feature.id)}
                                onMouseLeave={() => setHoveredModuleId(null)}
                                onClick={() =>
                                  setSelectedModuleId(isSelected ? null : item.feature.id)
                                }
                                className={`grid grid-cols-12 items-center p-2.5 text-xs transition-all duration-200 active:scale-[0.99] cursor-pointer divide-x divide-slate-800 ${
                                  isSelected
                                    ? 'bg-indigo-500/15'
                                    : isHovered
                                    ? 'bg-slate-800/60'
                                    : 'hover:bg-slate-800/40'
                                }`}
                              >
                                <div className="col-span-4 pl-6 pr-3 flex items-center justify-between">
                                  <div className="truncate">
                                    <div className="font-semibold text-xs text-slate-200 truncate">
                                      {item.feature.name}
                                    </div>
                                    <div className="text-[10px] text-slate-500 capitalize">
                                      {item.feature.category.replace('_', ' ')} • {item.roles[0]}
                                    </div>
                                  </div>
                                  <span className="text-[11px] font-bold text-emerald-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/50 flex-shrink-0 ml-2">
                                    {item.adjustedHours}h
                                  </span>
                                </div>

                                <div className="col-span-8 pl-3 pr-2 py-0.5 relative h-7 flex items-center">
                                  <div className="absolute inset-0 flex divide-x divide-slate-800/70 pointer-events-none">
                                    {weekNumbers.map((w) => (
                                      <div key={w} className="flex-1 h-full"></div>
                                    ))}
                                  </div>

                                  <div
                                    style={{
                                      left: `${modStartPct}%`,
                                      width: `${modWidthPct}%`
                                    }}
                                    className={`relative h-5 rounded-md ${item.phaseColor.bar} text-white shadow-sm flex items-center justify-between px-2 text-[10px] font-bold z-10 transition-all duration-200 ${
                                      isHovered || isSelected ? 'ring-2 ring-indigo-400 brightness-110' : ''
                                    }`}
                                  >
                                    <span className="truncate text-[9px]">
                                      W{item.startWeek}–W{item.endWeek}
                                    </span>
                                    <span className="text-[9px] opacity-90 hidden sm:inline">
                                      {item.durationWeeks}w
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* GANTT VIEW 2: MODULE SPRINTS LIST */}
            {viewMode === 'modules' && (
              <div className="divide-y divide-slate-800">
                {scheduledModules.map((item) => {
                  const modStartPct = ((item.startWeek - 1) / totalWeeks) * 100;
                  const modWidthPct = Math.max(5, (item.durationWeeks / totalWeeks) * 100);
                  const isHovered = hoveredModuleId === item.feature.id;
                  const isSelected = selectedModuleId === item.feature.id;

                  return (
                    <div
                      key={item.feature.id}
                      onMouseEnter={() => setHoveredModuleId(item.feature.id)}
                      onMouseLeave={() => setHoveredModuleId(null)}
                      onClick={() =>
                        setSelectedModuleId(isSelected ? null : item.feature.id)
                      }
                      className={`grid grid-cols-12 items-center p-2.5 text-xs transition-all duration-200 active:scale-[0.99] cursor-pointer divide-x divide-slate-800 ${
                        isSelected
                          ? 'bg-indigo-500/15'
                          : isHovered
                          ? 'bg-slate-800/60'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="col-span-4 pr-3 flex items-center justify-between">
                        <div className="truncate">
                          <div className="font-bold text-xs text-slate-100 truncate">
                            {item.feature.name}
                          </div>
                          <div className="text-[10px] text-slate-400 capitalize">
                            {item.phaseName} • {item.roles[0]}
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/50 flex-shrink-0 ml-2">
                          {item.adjustedHours}h
                        </span>
                      </div>

                      <div className="col-span-8 pl-3 pr-2 py-0.5 relative h-8 flex items-center">
                        <div className="absolute inset-0 flex divide-x divide-slate-800 pointer-events-none">
                          {weekNumbers.map((w) => (
                            <div key={w} className="flex-1 h-full"></div>
                          ))}
                        </div>

                        <div
                          style={{
                            left: `${modStartPct}%`,
                            width: `${modWidthPct}%`
                          }}
                          className={`relative h-6 rounded-md ${item.phaseColor.bar} text-white shadow-sm flex items-center justify-between px-2 text-[10px] font-bold z-10 transition-all duration-200 ${
                            isHovered || isSelected ? 'ring-2 ring-indigo-400 brightness-110' : ''
                          }`}
                        >
                          <span className="truncate">W{item.startWeek} – W{item.endWeek}</span>
                          <span className="text-[10px] opacity-90 hidden sm:inline">
                            {item.durationWeeks} Weeks
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* GANTT VIEW 3: CRITICAL PATH VIEW */}
            {viewMode === 'critical_path' && (
              <div className="divide-y divide-slate-800">
                <div className="p-3 bg-indigo-500/10 border-b border-indigo-500/20 text-xs text-indigo-200">
                  <span className="font-bold text-indigo-300">Critical Path Sequence:</span> Showing workstreams with zero slack that dictate the overall {totalWeeks}-week release commitment. Delays in these modules directly shift final deployment.
                </div>

                {scheduledModules
                  .filter((m) => m.isCriticalPath)
                  .map((item) => {
                    const modStartPct = ((item.startWeek - 1) / totalWeeks) * 100;
                    const modWidthPct = Math.max(5, (item.durationWeeks / totalWeeks) * 100);
                    const isHovered = hoveredModuleId === item.feature.id;
                    const isSelected = selectedModuleId === item.feature.id;

                    return (
                      <div
                        key={item.feature.id}
                        onMouseEnter={() => setHoveredModuleId(item.feature.id)}
                        onMouseLeave={() => setHoveredModuleId(null)}
                        onClick={() =>
                          setSelectedModuleId(isSelected ? null : item.feature.id)
                        }
                        className={`grid grid-cols-12 items-center p-3 text-xs transition-all duration-200 active:scale-[0.99] cursor-pointer divide-x divide-slate-800 ${
                          isSelected || isHovered ? 'bg-indigo-500/15' : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="col-span-4 pr-3 flex items-center justify-between">
                          <div className="truncate">
                            <div className="font-bold text-xs text-slate-100 truncate flex items-center space-x-1.5">
                              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                              <span>{item.feature.name}</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {item.phaseName}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                            Critical
                          </span>
                        </div>

                        <div className="col-span-8 pl-3 pr-2 py-0.5 relative h-8 flex items-center">
                          <div className="absolute inset-0 flex divide-x divide-slate-800 pointer-events-none">
                            {weekNumbers.map((w) => (
                              <div key={w} className="flex-1 h-full"></div>
                            ))}
                          </div>

                          <div
                            style={{
                              left: `${modStartPct}%`,
                              width: `${modWidthPct}%`
                            }}
                            className="relative h-6 rounded-md bg-indigo-600 text-white shadow-sm flex items-center justify-between px-2 text-[10px] font-bold z-10"
                          >
                            <span className="truncate">W{item.startWeek} – W{item.endWeek}</span>
                            <span>{item.durationWeeks}w</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Interactive Selected Module Detail Panel */}
      {selectedModule && (
        <div className="p-4 bg-slate-900/80 border border-indigo-500/40 rounded-xl space-y-3 transition-all duration-200">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-slate-100 flex items-center flex-wrap gap-2">
                <span>{selectedModule.feature.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 font-semibold border border-indigo-500/30">
                  {selectedModule.phaseName}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {selectedModule.feature.description}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedModuleId(null)}
              className="text-xs text-slate-400 hover:text-slate-100 font-bold px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/50 transition-all duration-200 active:scale-[0.98]"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-800">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold">Active Window</span>
              <div className="font-bold text-slate-100">
                Week {selectedModule.startWeek} → Week {selectedModule.endWeek}
              </div>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold">Effort & Duration</span>
              <div className="font-bold text-emerald-500">
                {selectedModule.adjustedHours} hrs (~{selectedModule.durationWeeks} weeks)
              </div>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold">Assigned Roles</span>
              <div className="font-bold text-slate-100 truncate">
                {selectedModule.roles.join(', ')}
              </div>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold">Estimated Allocation</span>
              <div className="font-bold text-emerald-500">
                {currencySymbol}{selectedModule.estimatedCost.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-300 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/50 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span>
              <strong className="text-slate-100">Milestone Deliverable:</strong> {selectedModule.deliverable}
            </span>
          </div>
        </div>
      )}

      {/* 5. Phase Legend Strip */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-700/50 flex-wrap gap-3">
        <div className="flex items-center space-x-4 flex-wrap gap-y-2">
          <span className="text-slate-200 font-bold text-[11px]">Phase Streams:</span>
          {highLevelPhases.map((p) => (
            <div key={p.id} className="flex items-center space-x-1.5 text-[11px]">
              <span className={`w-3 h-3 rounded-sm ${p.color.bar}`}></span>
              <span className="font-medium text-slate-300">
                P{p.id}: {p.name.split(':')[1]?.trim() || p.name}
              </span>
            </div>
          ))}
        </div>

        <div className="text-[11px] text-slate-500 italic">
          * Timeline dynamically recalibrates when squad headcount or modules change.
        </div>
      </div>
    </div>
  );
};
