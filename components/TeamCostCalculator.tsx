'use client';

import React from 'react';
import {
  ProjectState,
  TeamMemberConfig,
  ExperienceLevel,
  EngagementType
} from '@/types/estimator';
import {
  TEAM_ROLES,
  REGIONS
} from '@/lib/estimator-data';
import { calculateEffectiveMemberRate } from '@/lib/estimator-engine';
import {
  Users,
  Trash2,
  Globe2,
  Clock,
  ShieldCheck,
  Code2,
  Layout,
  Database,
  Smartphone,
  Palette,
  CheckCircle2,
  Cloud,
  Kanban,
  Percent
} from 'lucide-react';

interface TeamCostCalculatorProps {
  state: ProjectState;
  onChange: (updated: Partial<ProjectState>) => void;
  currencySymbol: string;
  exchangeRate: number;
}

const ROLE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  ShieldCheck,
  Code2,
  Layout,
  Database,
  Smartphone,
  Palette,
  CheckCircle2,
  Cloud,
  Kanban,
  Clock
};

export const TeamCostCalculator: React.FC<TeamCostCalculatorProps> = ({
  state,
  onChange,
  currencySymbol,
  exchangeRate
}) => {
  const currentRegion = REGIONS.find((r) => r.id === state.regionId) || REGIONS[0];

  const handleAddRole = (roleId: string) => {
    const existing = state.team.find((m) => m.roleId === roleId);
    if (existing) {
      const updated = state.team.map((m) =>
        m.roleId === roleId ? { ...m, count: m.count + 1 } : m
      );
      onChange({ team: updated });
    } else {
      const newMember: TeamMemberConfig = {
        id: `team_${roleId}_${Date.now()}`,
        roleId,
        count: 1,
        experienceLevel: 'senior',
        engagement: 'fulltime'
      };
      onChange({ team: [...state.team, newMember] });
    }
  };

  const handleUpdateMember = (id: string, updates: Partial<TeamMemberConfig>) => {
    const updated = state.team.map((m) => (m.id === id ? { ...m, ...updates } : m));
    onChange({ team: updated });
  };

  const handleRemoveMember = (id: string) => {
    onChange({ team: state.team.filter((m) => m.id !== id) });
  };

  return (
    <div className="space-y-6">
      {/* 1. Regional Cost Benchmark Card */}
      <div className="bg-white border border-[#DDE3E7] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono font-bold uppercase tracking-wider text-[#64707A] mb-1">
              <Globe2 className="w-4 h-4 text-[#082A1C]" />
              <span>Location Rate Benchmark Index</span>
            </div>
            <h3 className="text-xl font-bold text-[#082A1C] lb-heading">
              {currentRegion.flag} {currentRegion.name}{' '}
              <span className="inline-block ml-1 px-2 py-0.5 rounded bg-[#CDFF8C] text-[#082A1C] text-sm font-mono tabular-nums">
                {Math.round(currentRegion.rateMultiplier * 100)}% Rate Index
              </span>
            </h3>
            <p className="text-xs text-[#64707A] mt-1">
              {currentRegion.description}. Average Senior Engineer rate:{' '}
              <span className="text-[#082A1C] font-mono font-bold tabular-nums">
                {currencySymbol}{Math.round(currentRegion.avgSeniorRate * exchangeRate).toLocaleString()}/hr
              </span>.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {REGIONS.map((r) => {
            const active = state.regionId === r.id;
            return (
              <button
                key={r.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange({ regionId: r.id })}
                className={`p-3.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center justify-between ${
                  active
                    ? 'bg-white border-2 border-[#082A1C] shadow-md shadow-[#082A1C]/5 text-[#082A1C]'
                    : 'bg-[#F4F7F9] border-2 border-[#DDE3E7] hover:border-[#64707A]/60 text-[#082A1C]'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>{r.flag}</span>
                  <span>{r.name}</span>
                </div>
                <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-[#CDFF8C] text-[#082A1C] tabular-nums">
                  {(r.rateMultiplier * 100).toFixed(0)}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Team Roster Management */}
      <div className="bg-white p-6 rounded-2xl border border-[#DDE3E7] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-[#082A1C] text-base lb-heading flex items-center space-x-2">
              <Users className="w-5 h-5 text-[#082A1C]" />
              <span>Dedicated Development Team Composition</span>
            </h3>
            <p className="text-xs text-[#64707A]">
              Configure headcount, experience tiers, and engagement allocation
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleAddRole(e.target.value);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              className="px-3.5 py-2 text-xs bg-[#082A1C] hover:bg-[#144731] text-white rounded-xl font-bold cursor-pointer focus:outline-none shadow-sm transition-all duration-200 active:scale-[0.98]"
            >
              <option value="" disabled className="bg-white text-[#64707A]">
                + Add Team Role...
              </option>
              {TEAM_ROLES.map((r) => (
                <option key={r.id} value={r.id} className="bg-white text-[#082A1C]">
                  {r.title} ({currencySymbol}{Math.round(r.defaultHourlyRate * exchangeRate).toLocaleString()}/hr baseline)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Roster Table / List */}
        <div className="space-y-3">
          {state.team.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-[#DDE3E7] rounded-xl bg-[#F4F7F9]">
              <Users className="w-8 h-8 text-[#64707A] mx-auto mb-2" />
              <p className="text-xs font-semibold text-[#082A1C]">
                No roles currently assigned.
              </p>
              <p className="text-[11px] text-[#64707A] mt-0.5">
                Click &quot;+ Add Team Role&quot; or switch to Project Scope to generate an optimized squad.
              </p>
            </div>
          ) : (
            state.team.map((m) => {
              const role = TEAM_ROLES.find((r) => r.id === m.roleId);
              const roleTitle = role ? role.title : 'Engineering Role';
              const IconComp =
                role && ROLE_ICONS[role.iconName || 'Code2']
                  ? ROLE_ICONS[role.iconName || 'Code2']
                  : Code2;

              const effectiveRate = calculateEffectiveMemberRate(
                m.roleId,
                state.regionId,
                m.experienceLevel,
                m.customRate
              );

              let monthlyHours = 160;
              if (m.engagement === 'parttime_50') monthlyHours = 80;
              if (m.engagement === 'parttime_25') monthlyHours = 40;

              const memberMonthlyTotal = Math.round(
                effectiveRate * monthlyHours * m.count * exchangeRate
              );

              return (
                <div
                  key={m.id}
                  className="p-4 rounded-xl border border-[#DDE3E7] bg-[#F4F7F9] flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 hover:border-[#082A1C]/40 hover:bg-white"
                >
                  {/* Role Title & Icon */}
                  <div className="flex items-center space-x-3 md:w-1/4">
                    <div className="p-2.5 rounded-lg bg-[#082A1C] text-[#CDFF8C] flex-shrink-0">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[#082A1C]">{roleTitle}</div>
                      <div className="text-[11px] text-[#64707A] truncate max-w-[180px]">
                        {role?.description}
                      </div>
                    </div>
                  </div>

                  {/* Headcount */}
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-[#64707A] font-semibold uppercase">Headcount:</span>
                    <div className="flex items-center border border-[#DDE3E7] rounded-lg bg-white">
                      <button
                        type="button"
                        onClick={() => handleUpdateMember(m.id, { count: Math.max(1, m.count - 1) })}
                        className="px-2.5 py-1 text-xs font-bold text-[#64707A] hover:text-[#082A1C] transition-all duration-200 active:scale-[0.98]"
                        title="Decrease"
                      >
                        -
                      </button>
                      <span className="w-7 text-center font-mono font-bold text-xs text-[#082A1C] tabular-nums">{m.count}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateMember(m.id, { count: m.count + 1 })}
                        className="px-2.5 py-1 text-xs font-bold text-[#64707A] hover:text-[#082A1C] transition-all duration-200 active:scale-[0.98]"
                        title="Increase"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Seniority Tier */}
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-[#64707A] font-semibold uppercase">Tier:</span>
                    <select
                      value={m.experienceLevel}
                      onChange={(e) =>
                        handleUpdateMember(m.id, { experienceLevel: e.target.value as ExperienceLevel })
                      }
                      className="px-2.5 py-1.5 text-xs bg-white border border-[#DDE3E7] rounded-lg text-[#082A1C] font-medium focus:outline-none focus:border-[#082A1C]"
                    >
                      <option value="junior">Junior (0.75x)</option>
                      <option value="mid">Mid-Level (1.0x)</option>
                      <option value="senior">Senior (1.28x)</option>
                      <option value="lead">Principal / Lead (1.55x)</option>
                    </select>
                  </div>

                  {/* Engagement */}
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-[#64707A] font-semibold uppercase">Allocation:</span>
                    <select
                      value={m.engagement}
                      onChange={(e) =>
                        handleUpdateMember(m.id, { engagement: e.target.value as EngagementType })
                      }
                      className="px-2.5 py-1.5 text-xs bg-white border border-[#DDE3E7] rounded-lg text-[#082A1C] font-medium focus:outline-none focus:border-[#082A1C]"
                    >
                      <option value="fulltime">Full-Time (160h/mo)</option>
                      <option value="parttime_50">Part-Time (80h/mo)</option>
                      <option value="parttime_25">Advisory (40h/mo)</option>
                    </select>
                  </div>

                  {/* Rate & Total */}
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-[#082A1C] tabular-nums">
                        {currencySymbol}{memberMonthlyTotal.toLocaleString()}/mo
                      </div>
                      <div className="text-[10px] font-mono text-[#64707A] tabular-nums">
                        ~{currencySymbol}{Math.round(effectiveRate * exchangeRate)}/hr
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(m.id)}
                      className="p-1.5 text-[#64707A] hover:text-red-600 transition-all duration-200 active:scale-[0.98]"
                      title="Remove role"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. Margins & Risk Buffer Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contingency Buffer */}
        <div className="bg-white p-6 rounded-2xl border border-[#DDE3E7] shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-[#082A1C] flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-[#082A1C]" />
              <span>Contingency & Risk Buffer</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-[#CDFF8C] text-[#082A1C] font-mono font-bold tabular-nums">
              {state.contingencyBufferPercent}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={30}
            step={5}
            value={state.contingencyBufferPercent}
            onChange={(e) => onChange({ contingencyBufferPercent: Number(e.target.value) })}
            className="w-full accent-[#082A1C] cursor-pointer"
          />
          <p className="text-[11px] text-[#64707A] leading-normal">
            Safeguards against scope expansion, unexpected technical debt, third-party API deprecations, and integration bottlenecks.
          </p>
        </div>

        {/* Agency Margin */}
        <div className="bg-white p-6 rounded-2xl border border-[#DDE3E7] shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-[#082A1C] flex items-center space-x-1.5">
              <Percent className="w-4 h-4 text-[#082A1C]" />
              <span>Management Overhead & Quality Assurance Margin</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-[#CDFF8C] text-[#082A1C] font-mono font-bold tabular-nums">
              {state.profitMarginPercent}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={35}
            step={5}
            value={state.profitMarginPercent}
            onChange={(e) => onChange({ profitMarginPercent: Number(e.target.value) })}
            className="w-full accent-[#082A1C] cursor-pointer"
          />
          <p className="text-[11px] text-[#64707A] leading-normal">
            Covers dedicated project management overhead, automated CI/CD tooling, architecture governance, and SLA maintenance reserves.
          </p>
        </div>
      </div>
    </div>
  );
};
