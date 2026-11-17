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
    bar: 'bg-[#082A1C]',
    light: 'bg-[#082A1C]/10',
    text: 'text-[#082A1C]',
    border: 'border-[#082A1C]/20',
    hover: 'hover:bg-[#10422D]'
  },
  2: {
    bar: 'bg-[#144731]',
    light: 'bg-[#144731]/10',
    text: 'text-[#144731]',
    border: 'border-[#144731]/20',
    hover: 'hover:bg-[#1B5C40]'
  },
  3: {
    bar: 'bg-[#245C44]',
    light: 'bg-[#245C44]/10',
    text: 'text-[#245C44]',
    border: 'border-[#245C44]/20',
    hover: 'hover:bg-[#2E7255]'
  },
  4: {
    bar: 'bg-[#466357]',
    light: 'bg-[#466357]/10',
    text: 'text-[#466357]',
    border: 'border-[#466357]/20',
    hover: 'hover:bg-[#537467]'
  },
  5: {
    bar: 'bg-[#64707A]',
    light: 'bg-[#64707A]/10',
    text: 'text-[#64707A]',
    border: 'border-[#64707A]/20',
    hover: 'hover:bg-[#525D66]'
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
    <div className="bg-white border border-[#DDE3E7] rounded-2xl p-6 sm:p-8 space-y-6">
      {/* 1. Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#DDE3E7]">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#64707A] mb-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#082A1C]" />
            <span>Interactive Delivery Schedule & Phase GANTT</span>
          </div>
          <h3 className="text-lg font-semibold text-[#082A1C] lb-heading">
            Engineering Timeline & Module Phase Breakdown
          </h3>
          <p className="text-xs text-[#64707A] max-w-2xl mt-0.5">
            Dynamic Gantt chart modeling parallel sprint velocities, dependencies, and delivery windows for all{' '}
            <strong className="text-[#082A1C] font-semibold">{state.selectedFeatureIds.length} scoped modules</strong> across{' '}
            <strong className="text-[#082A1C] font-semibold tabular-nums">{totalWeeks} weeks</strong>.
          </p>
        </div>

        {/* View Mode Switcher (Flat Minimalism) */}
        <div className="flex items-center gap-4 border-b border-[#DDE3E7]">
          <button
            type="button"
            onClick={() => setViewMode('phases')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all duration-200 active:scale-[0.98] whitespace-nowrap ${
              viewMode === 'phases'
                ? 'border-[#082A1C] text-[#082A1C]'
                : 'border-transparent text-[#64707A] hover:text-[#082A1C]'
            }`}
          >
            Phased Timeline
          </button>
          <button
            type="button"
            onClick={() => setViewMode('modules')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all duration-200 active:scale-[0.98] whitespace-nowrap ${
              viewMode === 'modules'
                ? 'border-[#082A1C] text-[#082A1C]'
                : 'border-transparent text-[#64707A] hover:text-[#082A1C]'
            }`}
          >
            Module Sprints ({scheduledModules.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode('critical_path')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all duration-200 active:scale-[0.98] whitespace-nowrap ${
              viewMode === 'critical_path'
                ? 'border-[#082A1C] text-[#082A1C]'
                : 'border-transparent text-[#64707A] hover:text-[#082A1C]'
            }`}
          >
            Critical Path
          </button>
        </div>
      </div>

      {/* 2. Timeline Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F4F7F9] p-4 rounded-xl border border-[#DDE3E7]">
        <div>
          <div className="text-[11px] font-medium text-[#64707A]">Total Delivery Span</div>
          <div className="text-sm font-semibold text-[#082A1C] flex items-center space-x-1.5 mt-0.5 tabular-nums">
            <Clock className="w-4 h-4 text-[#082A1C]" />
            <span>{totalWeeks} Calendar Weeks</span>
          </div>
          <div className="text-[10px] text-[#64707A] mt-0.5 tabular-nums">
            ~{estimate.estimatedTimelineMonths} Months ({Math.ceil(totalWeeks / 2)} Sprints)
          </div>
        </div>

        <div>
          <div className="text-[11px] font-medium text-[#64707A]">Engineering Capacity</div>
          <div className="text-sm font-semibold text-[#082A1C] flex items-center space-x-1.5 mt-0.5 tabular-nums">
            <Users className="w-4 h-4 text-[#082A1C]" />
            <span>{state.team.reduce((sum, m) => sum + m.count, 0)} Active Roles</span>
          </div>
          <div className="text-[10px] text-[#082A1C] font-semibold mt-0.5 tabular-nums">
            {estimate.teamTotalMonthlyCapacityHours} hrs/mo sprint velocity
          </div>
        </div>

        <div>
          <div className="text-[11px] font-medium text-[#64707A]">Scheduled Scope</div>
          <div className="text-sm font-semibold text-[#082A1C] flex items-center space-x-1.5 mt-0.5 tabular-nums">
            <Zap className="w-4 h-4 text-[#082A1C]" />
            <span>{scheduledModules.length} Technical Modules</span>
          </div>
          <div className="text-[10px] text-[#082A1C] font-semibold mt-0.5 tabular-nums">
            {estimate.totalHours} total engineering hours
          </div>
        </div>

        <div>
          <div className="text-[11px] font-medium text-[#64707A]">Schedule Target Status</div>
          <div className="text-sm font-semibold text-[#082A1C] flex items-center space-x-1.5 mt-0.5">
            <CheckCircle2 className="w-4 h-4 text-[#082A1C]" />
            <span className="capitalize">{estimate.velocityStatus}</span>
          </div>
          <div className="text-[10px] text-[#64707A] mt-0.5 tabular-nums">
            Target: {state.targetTimelineWeeks}w vs Projected: {estimate.estimatedTimelineWeeks}w
          </div>
        </div>
      </div>

      {/* 3. Gantt Chart Canvas */}
      <div className="space-y-4">
        {/* Milestone Flags Bar */}
        <div className="bg-[#F4F7F9] p-3.5 rounded-xl border border-[#DDE3E7]">
          <div className="flex items-center justify-between text-xs font-semibold text-[#082A1C] mb-2.5">
            <span className="flex items-center space-x-1.5">
              <Flag className="w-3.5 h-3.5 text-[#082A1C]" />
              <span>Key Delivery Milestones & Quality Gates</span>
            </span>
            <span className="text-[11px] font-medium text-[#64707A]">
              5 Primary Releases
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
            {milestones.map((m, idx) => (
              <div
                key={idx}
                className="bg-white p-2.5 rounded-lg border border-[#DDE3E7] text-[11px]"
              >
                <div className="flex items-center justify-between text-[#64707A] mb-1">
                  <span className="font-semibold text-[#082A1C] tabular-nums">Week {m.week}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#CDFF8C] text-[#082A1C] font-semibold tabular-nums">
                    M{idx + 1}
                  </span>
                </div>
                <div className="font-semibold text-[#082A1C] leading-snug line-clamp-1">{m.title}</div>
                <div className="text-[10px] text-[#64707A] line-clamp-1 mt-0.5">{m.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Gantt Timeline Table */}
        <div className="overflow-x-auto border border-[#DDE3E7] rounded-xl bg-white">
          <div className="min-w-[760px]">
            {/* Timeline Header Ruler */}
            <div className="grid grid-cols-12 bg-[#F4F7F9] border-b border-[#DDE3E7] text-[#082A1C] text-xs font-semibold divide-x divide-[#DDE3E7]">
              <div className="col-span-4 p-3 flex items-center justify-between">
                <span>Phase & Module Specification</span>
                <span className="text-[11px] font-medium text-[#64707A]">Duration</span>
              </div>
              <div className="col-span-8 p-3 flex items-center justify-between relative">
                <span className="text-[#082A1C] font-semibold text-[11px]">
                  Sprint Timeline (Weeks 1 to {totalWeeks})
                </span>
                <div className="flex items-center space-x-2 text-[10px] text-[#64707A] font-medium">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#CDFF8C] border border-[#082A1C]/30"></span>
                  <span>Milestone / Sprint</span>
                </div>
              </div>
            </div>

            {/* Week Columns Bar Indicator */}
            <div className="grid grid-cols-12 bg-[#F4F7F9]/60 border-b border-[#DDE3E7] text-[10px] font-semibold text-[#64707A] divide-x divide-[#DDE3E7]">
              <div className="col-span-4 px-3 py-1.5 flex items-center justify-between">
                <span>Workstream Item</span>
                <span>Effort (Hrs)</span>
              </div>
              <div className="col-span-8 px-2 py-1.5 flex items-center justify-between">
                {weekNumbers.map((w) => (
                  <div key={w} className="flex-1 text-center font-mono tabular-nums">
                    W{w}
                  </div>
                ))}
              </div>
            </div>

            {/* GANTT VIEW 1: PHASE BREAKDOWN WITH NESTED MODULES */}
            {viewMode === 'phases' && (
              <div className="divide-y divide-[#DDE3E7]">
                {highLevelPhases.map((phase) => {
                  const phaseModules = scheduledModules.filter((m) => m.phaseId === phase.id);
                  const isExpanded = expandedPhaseIds.includes(phase.id);
                  const phaseStartPct = ((phase.startWeek - 1) / totalWeeks) * 100;
                  const phaseWidthPct = Math.max(
                    8,
                    ((phase.endWeek - phase.startWeek + 0.8) / totalWeeks) * 100
                  );

                  return (
                    <div key={phase.id} className="hover:bg-[#F4F7F9]/60 transition-all duration-200">
                      {/* Main Phase Row */}
                      <div className="grid grid-cols-12 items-center p-3 divide-x divide-[#DDE3E7]">
                        <div className="col-span-4 pr-3">
                          <button
                            type="button"
                            onClick={() => togglePhaseExpand(phase.id)}
                            className="flex items-center space-x-2 text-left w-full group transition-all duration-200 active:scale-[0.98]"
                          >
                            <span className="p-0.5 rounded text-[#64707A] group-hover:text-[#082A1C] transition-all duration-200">
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </span>
                            <div>
                              <div className="font-semibold text-xs text-[#082A1C] transition-all duration-200 flex items-center space-x-1.5">
                                <span>{phase.name}</span>
                              </div>
                              <div className="text-[10px] text-[#64707A] line-clamp-1">
                                {phase.description}
                              </div>
                            </div>
                          </button>
                        </div>

                        {/* Phase Bar Track */}
                        <div className="col-span-8 pl-3 pr-2 py-1 relative h-9 flex items-center">
                          <div className="absolute inset-0 flex divide-x divide-[#DDE3E7]/70 pointer-events-none">
                            {weekNumbers.map((w) => (
                              <div key={w} className="flex-1 h-full"></div>
                            ))}
                          </div>

                          <div
                            style={{
                              left: `${phaseStartPct}%`,
                              width: `${phaseWidthPct}%`
                            }}
                            className={`relative h-6 rounded-lg ${phase.color.bar} text-white shadow-sm flex items-center justify-between px-2.5 text-[10px] font-semibold z-10 transition-all duration-200 hover:brightness-110 tabular-nums`}
                          >
                            <span className="truncate">W{phase.startWeek} – W{phase.endWeek}</span>
                            <span className="text-[#CDFF8C] ml-1">{phase.percentage}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Nested Modules */}
                      {isExpanded && phaseModules.length > 0 && (
                        <div className="bg-[#F4F7F9]/50 divide-y divide-[#DDE3E7]/80">
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
                                className={`grid grid-cols-12 items-center p-2.5 text-xs transition-all duration-200 active:scale-[0.99] cursor-pointer divide-x divide-[#DDE3E7] ${
                                  isSelected
                                    ? 'bg-[#CDFF8C]/35'
                                    : isHovered
                                    ? 'bg-[#F4F7F9]'
                                    : 'hover:bg-[#F4F7F9]'
                                }`}
                              >
                                <div className="col-span-4 pl-6 pr-3 flex items-center justify-between">
                                  <div className="truncate">
                                    <div className="font-semibold text-xs text-[#082A1C] truncate">
                                      {item.feature.name}
                                    </div>
                                    <div className="text-[10px] text-[#64707A] capitalize">
                                      {item.feature.category.replace('_', ' ')} · {item.roles[0]}
                                    </div>
                                  </div>
                                  <span className="text-[11px] font-semibold text-[#082A1C] bg-white px-1.5 py-0.5 rounded border border-[#DDE3E7] flex-shrink-0 ml-2 tabular-nums">
                                    {item.adjustedHours}h
                                  </span>
                                </div>

                                <div className="col-span-8 pl-3 pr-2 py-0.5 relative h-7 flex items-center">
                                  <div className="absolute inset-0 flex divide-x divide-[#DDE3E7]/60 pointer-events-none">
                                    {weekNumbers.map((w) => (
                                      <div key={w} className="flex-1 h-full"></div>
                                    ))}
                                  </div>

                                  <div
                                    style={{
                                      left: `${modStartPct}%`,
                                      width: `${modWidthPct}%`
                                    }}
                                    className={`relative h-5 rounded-md ${item.phaseColor.bar} text-white shadow-sm flex items-center justify-between px-2 text-[10px] font-semibold z-10 transition-all duration-200 tabular-nums ${
                                      isHovered || isSelected ? 'ring-2 ring-[#CDFF8C]' : ''
                                    }`}
                                  >
                                    <span className="truncate text-[9px]">
                                      W{item.startWeek}–W{item.endWeek}
                                    </span>
                                    <span className="text-[9px] text-[#CDFF8C] hidden sm:inline">
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
              <div className="divide-y divide-[#DDE3E7]">
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
                      className={`grid grid-cols-12 items-center p-2.5 text-xs transition-all duration-200 active:scale-[0.99] cursor-pointer divide-x divide-[#DDE3E7] ${
                        isSelected
                          ? 'bg-[#CDFF8C]/35'
                          : isHovered
                          ? 'bg-[#F4F7F9]'
                          : 'hover:bg-[#F4F7F9]'
                      }`}
                    >
                      <div className="col-span-4 pr-3 flex items-center justify-between">
                        <div className="truncate">
                          <div className="font-semibold text-xs text-[#082A1C] truncate">
                            {item.feature.name}
                          </div>
                          <div className="text-[10px] text-[#64707A] capitalize">
                            {item.phaseName} · {item.roles[0]}
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold text-[#082A1C] bg-[#F4F7F9] px-1.5 py-0.5 rounded border border-[#DDE3E7] flex-shrink-0 ml-2 tabular-nums">
                          {item.adjustedHours}h
                        </span>
                      </div>

                      <div className="col-span-8 pl-3 pr-2 py-0.5 relative h-8 flex items-center">
                        <div className="absolute inset-0 flex divide-x divide-[#DDE3E7]/60 pointer-events-none">
                          {weekNumbers.map((w) => (
                            <div key={w} className="flex-1 h-full"></div>
                          ))}
                        </div>

                        <div
                          style={{
                            left: `${modStartPct}%`,
                            width: `${modWidthPct}%`
                          }}
                          className={`relative h-6 rounded-md ${item.phaseColor.bar} text-white shadow-sm flex items-center justify-between px-2 text-[10px] font-semibold z-10 transition-all duration-200 tabular-nums ${
                            isHovered || isSelected ? 'ring-2 ring-[#CDFF8C]' : ''
                          }`}
                        >
                          <span className="truncate">W{item.startWeek} – W{item.endWeek}</span>
                          <span className="text-[10px] text-[#CDFF8C] hidden sm:inline">
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
              <div className="divide-y divide-[#DDE3E7]">
                <div className="p-3 bg-[#CDFF8C]/30 border-b border-[#DDE3E7] text-xs text-[#082A1C]">
                  <span className="font-semibold">Critical Path Sequence:</span> Showing workstreams with zero slack that dictate the overall {totalWeeks}-week release commitment. Delays in these modules directly shift final deployment.
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
                        className={`grid grid-cols-12 items-center p-3 text-xs transition-all duration-200 active:scale-[0.99] cursor-pointer divide-x divide-[#DDE3E7] ${
                          isSelected || isHovered ? 'bg-[#CDFF8C]/30' : 'hover:bg-[#F4F7F9]'
                        }`}
                      >
                        <div className="col-span-4 pr-3 flex items-center justify-between">
                          <div className="truncate">
                            <div className="font-semibold text-xs text-[#082A1C] truncate">
                              {item.feature.name}
                            </div>
                            <div className="text-[10px] text-[#64707A]">
                              {item.phaseName}
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold text-[#082A1C] bg-[#CDFF8C] px-2 py-0.5 rounded">
                            Critical
                          </span>
                        </div>

                        <div className="col-span-8 pl-3 pr-2 py-0.5 relative h-8 flex items-center">
                          <div className="absolute inset-0 flex divide-x divide-[#DDE3E7]/60 pointer-events-none">
                            {weekNumbers.map((w) => (
                              <div key={w} className="flex-1 h-full"></div>
                            ))}
                          </div>

                          <div
                            style={{
                              left: `${modStartPct}%`,
                              width: `${modWidthPct}%`
                            }}
                            className="relative h-6 rounded-md bg-[#082A1C] text-white shadow-sm flex items-center justify-between px-2 text-[10px] font-semibold z-10 tabular-nums"
                          >
                            <span className="truncate">W{item.startWeek} – W{item.endWeek}</span>
                            <span className="text-[#CDFF8C]">{item.durationWeeks}w</span>
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
        <div className="p-5 bg-[#082A1C] text-white border border-[#1A4733] rounded-xl space-y-3 transition-all duration-200">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-white flex items-center flex-wrap gap-2">
                <span>{selectedModule.feature.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#CDFF8C] text-[#082A1C] font-semibold">
                  {selectedModule.phaseName}
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8] mt-1 max-w-2xl leading-relaxed">
                {selectedModule.feature.description}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedModuleId(null)}
              className="text-xs text-[#94A3B8] hover:text-white font-semibold px-2.5 py-1 rounded-lg bg-[#0F3827] border border-[#1E4F3A] transition-all duration-200 active:scale-[0.98]"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-[#1A4733]">
            <div>
              <span className="text-[#94A3B8] text-[10px] uppercase font-semibold">Active Window</span>
              <div className="font-semibold text-white tabular-nums">
                Week {selectedModule.startWeek} → Week {selectedModule.endWeek}
              </div>
            </div>
            <div>
              <span className="text-[#94A3B8] text-[10px] uppercase font-semibold">Effort & Duration</span>
              <div className="font-semibold text-[#CDFF8C] tabular-nums">
                {selectedModule.adjustedHours} hrs (~{selectedModule.durationWeeks} weeks)
              </div>
            </div>
            <div>
              <span className="text-[#94A3B8] text-[10px] uppercase font-semibold">Assigned Roles</span>
              <div className="font-semibold text-white truncate">
                {selectedModule.roles.join(', ')}
              </div>
            </div>
            <div>
              <span className="text-[#94A3B8] text-[10px] uppercase font-semibold">Estimated Allocation</span>
              <div className="font-semibold text-[#CDFF8C] tabular-nums">
                {currencySymbol}{selectedModule.estimatedCost.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-white/90 bg-[#0F3827] p-2.5 rounded-lg border border-[#1E4F3A] flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#CDFF8C] flex-shrink-0" />
            <span>
              <strong className="text-white">Milestone Deliverable:</strong> {selectedModule.deliverable}
            </span>
          </div>
        </div>
      )}

      {/* 5. Phase Legend Strip */}
      <div className="flex items-center justify-between text-xs text-[#64707A] pt-3 border-t border-[#DDE3E7] flex-wrap gap-3">
        <div className="flex items-center space-x-4 flex-wrap gap-y-2">
          <span className="text-[#082A1C] font-semibold text-[11px]">Phase Streams:</span>
          {highLevelPhases.map((p) => (
            <div key={p.id} className="flex items-center space-x-1.5 text-[11px]">
              <span className={`w-3 h-3 rounded-sm ${p.color.bar}`}></span>
              <span className="font-medium text-[#082A1C]">
                P{p.id}: {p.name.split(':')[1]?.trim() || p.name}
              </span>
            </div>
          ))}
        </div>

        <div className="text-[11px] text-[#64707A] italic">
          * Timeline dynamically recalibrates when squad headcount or modules change.
        </div>
      </div>
    </div>
  );
};
