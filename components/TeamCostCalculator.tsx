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
      <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">
              <Globe2 className="w-4 h-4" />
              <span>Location Rate Benchmark Index</span>
            </div>
            <h3 className="text-xl font-bold text-slate-100 tracking-tight">
              {currentRegion.flag} {currentRegion.name}{' '}
              <span className="text-emerald-500">({Math.round(currentRegion.rateMultiplier * 100)}% Rate Index)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {currentRegion.description}. Average Senior Engineer rate:{' '}
              <span className="text-emerald-500 font-semibold">${currentRegion.avgSeniorRate}/hr</span>.
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
                    ? 'bg-slate-800/80 border-2 border-indigo-500 shadow-md shadow-indigo-500/5 text-slate-100'
                    : 'bg-slate-800/40 border-2 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>{r.flag}</span>
                  <span>{r.name}</span>
                </div>
                <span className="text-xs font-bold text-emerald-500">
                  {(r.rateMultiplier * 100).toFixed(0)}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Team Roster Management */}
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700/50 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-slate-100 text-base flex items-center space-x-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <span>Dedicated Development Team Composition</span>
            </h3>
            <p className="text-xs text-slate-400">
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
              className="px-3.5 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold cursor-pointer focus:outline-none shadow-md shadow-indigo-500/20 transition-all duration-200 active:scale-[0.98]"
            >
              <option value="" disabled className="bg-slate-900 text-slate-400">
                + Add Team Role...
              </option>
              {TEAM_ROLES.map((r) => (
                <option key={r.id} value={r.id} className="bg-slate-900 text-slate-100">
                  {r.title} (${r.defaultHourlyRate}/hr baseline)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Roster Table / List */}
        <div className="space-y-3">
          {state.team.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-slate-700/50 rounded-xl bg-slate-900/40">
              <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-300">
                No roles currently assigned.
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
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
                  className="p-4 rounded-xl border border-slate-700/50 bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 hover:border-slate-600"
                >
                  {/* Role Title & Icon */}
                  <div className="flex items-center space-x-3 md:w-1/4">
                    <div className="p-2.5 rounded-lg bg-indigo-500/15 text-indigo-400 flex-shrink-0 border border-indigo-500/30">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-100">{roleTitle}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                        {role?.description}
                      </div>
                    </div>
                  </div>

                  {/* Headcount */}
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-400 font-semibold uppercase">Headcount:</span>
                    <div className="flex items-center border border-slate-700/50 rounded-lg bg-slate-800">
                      <button
                        type="button"
                        onClick={() => handleUpdateMember(m.id, { count: Math.max(1, m.count - 1) })}
                        className="px-2.5 py-1 text-xs font-bold text-slate-400 hover:text-slate-100 transition-all duration-200 active:scale-[0.98]"
                        title="Decrease"
                      >
                        -
                      </button>
                      <span className="w-7 text-center font-bold text-xs text-slate-100">{m.count}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateMember(m.id, { count: m.count + 1 })}
                        className="px-2.5 py-1 text-xs font-bold text-slate-400 hover:text-slate-100 transition-all duration-200 active:scale-[0.98]"
                        title="Increase"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Seniority Tier */}
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-400 font-semibold uppercase">Tier:</span>
                    <select
                      value={m.experienceLevel}
                      onChange={(e) =>
                        handleUpdateMember(m.id, { experienceLevel: e.target.value as ExperienceLevel })
                      }
                      className="px-2.5 py-1.5 text-xs bg-slate-800 border border-slate-700/50 rounded-lg text-slate-100 font-medium focus:outline-none focus:border-indigo-500"
                    >
                      <option value="junior">Junior (0.75x)</option>
                      <option value="mid">Mid-Level (1.0x)</option>
                      <option value="senior">Senior (1.28x)</option>
                      <option value="lead">Principal / Lead (1.55x)</option>
                    </select>
                  </div>

                  {/* Engagement */}
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-400 font-semibold uppercase">Allocation:</span>
                    <select
                      value={m.engagement}
                      onChange={(e) =>
                        handleUpdateMember(m.id, { engagement: e.target.value as EngagementType })
                      }
                      className="px-2.5 py-1.5 text-xs bg-slate-800 border border-slate-700/50 rounded-lg text-slate-100 font-medium focus:outline-none focus:border-indigo-500"
                    >
                      <option value="fulltime">Full-Time (160h/mo)</option>
                      <option value="parttime_50">Part-Time (80h/mo)</option>
                      <option value="parttime_25">Advisory (40h/mo)</option>
                    </select>
                  </div>

                  {/* Rate & Total */}
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-500">
                        {currencySymbol}{memberMonthlyTotal.toLocaleString()}/mo
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ~{currencySymbol}{Math.round(effectiveRate * exchangeRate)}/hr
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(m.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition-all duration-200 active:scale-[0.98]"
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
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700/50 shadow-xl space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-200 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Contingency & Risk Buffer</span>
            </span>
            <span className="text-emerald-500 font-bold">{state.contingencyBufferPercent}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={30}
            step={5}
            value={state.contingencyBufferPercent}
            onChange={(e) => onChange({ contingencyBufferPercent: Number(e.target.value) })}
            className="w-full accent-indigo-500 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400 leading-normal">
            Safeguards against scope expansion, unexpected technical debt, third-party API deprecations, and integration bottlenecks.
          </p>
        </div>

        {/* Agency Margin */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700/50 shadow-xl space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-200 flex items-center space-x-1.5">
              <Percent className="w-4 h-4 text-emerald-500" />
              <span>Management Overhead & Quality Assurance Margin</span>
            </span>
            <span className="text-emerald-500 font-bold">{state.profitMarginPercent}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={35}
            step={5}
            value={state.profitMarginPercent}
            onChange={(e) => onChange({ profitMarginPercent: Number(e.target.value) })}
            className="w-full accent-indigo-500 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400 leading-normal">
            Covers dedicated project management overhead, automated CI/CD tooling, architecture governance, and SLA maintenance reserves.
          </p>
        </div>
      </div>
    </div>
  );
};
