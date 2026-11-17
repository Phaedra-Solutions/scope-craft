'use client';

import React, { useState } from 'react';
import { ProjectState, ScenarioComparisonItem } from '@/types/estimator';
import { calculateEstimate } from '@/lib/estimator-engine';
import { REGIONS } from '@/lib/estimator-data';
import {
  GitCompare,
  Plus,
  Trash2,
  ArrowRight,
  Clock,
  DollarSign,
  Users,
  ShieldCheck,
  Layers,
  Download
} from 'lucide-react';
import { downloadFile } from '@/lib/export-helpers';

interface ScenarioComparisonProps {
  currentState: ProjectState;
  onLoadState: (state: ProjectState) => void;
  currencySymbol: string;
  exchangeRate: number;
}

export const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({
  currentState,
  onLoadState,
  currencySymbol,
  exchangeRate
}) => {
  const [scenarios, setScenarios] = useState<ScenarioComparisonItem[]>(() => {
    const scenario1State: ProjectState = {
      ...currentState,
      projectName: 'Scenario A: USA/Canada Benchmark',
      regionId: 'us_canada',
      contingencyBufferPercent: 15
    };

    const scenario2State: ProjectState = {
      ...currentState,
      projectName: 'Scenario B: ScopeCraft Dedicated Squad',
      regionId: 'phaedra',
      contingencyBufferPercent: 15
    };

    return [
      {
        id: 'scen_1',
        name: 'Scenario A: USA/Canada Benchmark (100%)',
        state: scenario1State,
        result: calculateEstimate(scenario1State)
      },
      {
        id: 'scen_2',
        name: 'Scenario B: ScopeCraft Dedicated Squad (30%)',
        state: scenario2State,
        result: calculateEstimate(scenario2State)
      }
    ];
  });

  const [newScenarioName, setNewScenarioName] = useState('');

  const handleSaveCurrentAsScenario = () => {
    const name = newScenarioName.trim() || `Scenario ${scenarios.length + 1}: ${currentState.projectName}`;
    const newScen: ScenarioComparisonItem = {
      id: `scen_${Date.now()}`,
      name,
      state: JSON.parse(JSON.stringify(currentState)),
      result: calculateEstimate(currentState)
    };
    setScenarios([...scenarios, newScen]);
    setNewScenarioName('');
  };

  const handleRemoveScenario = (id: string) => {
    setScenarios(scenarios.filter((s) => s.id !== id));
  };

  const handleExportScenariosCsv = () => {
    const rows = [
      ['SCENARIO COMPARISON REPORT'],
      ['Export Date', new Date().toLocaleDateString('en-US')],
      [],
      ['Scenario Name', 'Region', 'Grand Total Cost', 'Timeline (Weeks)', 'Total Hours', 'Monthly Burn', 'Headcount', 'Features Count'],
      ...scenarios.map((scen) => {
        const reg = REGIONS.find((r) => r.id === scen.state.regionId) || REGIONS[0];
        const res = scen.result;
        return [
          scen.name,
          `${reg.flag} ${reg.name}`,
          `${currencySymbol}${Math.round(res.grandTotalCost * exchangeRate).toLocaleString()}`,
          res.estimatedTimelineWeeks,
          res.totalHours,
          `${currencySymbol}${Math.round(res.teamMonthlyBurnRate * exchangeRate).toLocaleString()}`,
          scen.state.team.reduce((acc, m) => acc + m.count, 0),
          scen.state.selectedFeatureIds.length
        ];
      })
    ];

    const csvContent = rows
      .map((row) =>
        row
          .map((item) => {
            const str = String(item ?? '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(',')
      )
      .join('\r\n');

    downloadFile(csvContent, 'Scenario_Comparison_Matrix.csv', 'text/csv;charset=utf-8;');
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800 p-6 rounded-2xl border border-slate-700/50 shadow-xl">
        <div>
          <h3 className="font-bold text-slate-100 text-lg flex items-center space-x-2">
            <GitCompare className="w-5 h-5 text-indigo-400" />
            <span>Scenario Comparison Matrix</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare regional rates, team configurations, and delivery milestones side-by-side
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {scenarios.length > 0 && (
            <button
              type="button"
              onClick={handleExportScenariosCsv}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all duration-200 active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}

          <input
            type="text"
            value={newScenarioName}
            onChange={(e) => setNewScenarioName(e.target.value)}
            placeholder="Name this scenario..."
            className="px-3 py-2 text-xs bg-slate-900/70 border border-slate-700/50 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-100 placeholder:text-slate-500 transition-all duration-200"
          />
          <button
            type="button"
            onClick={handleSaveCurrentAsScenario}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all duration-200 active:scale-[0.98] shadow-md shadow-indigo-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Save Scenario</span>
          </button>
        </div>
      </div>

      {/* Comparison Grid */}
      {scenarios.length === 0 ? (
        <div className="text-center py-12 bg-slate-800 rounded-2xl border border-slate-700/50 shadow-xl">
          <GitCompare className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">No scenarios saved for comparison.</p>
          <p className="text-xs text-slate-500 mt-1">Click &quot;Save Scenario&quot; above to snapshot your current setup.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenarios.map((scen) => {
            const res = scen.result;
            const convertedGrandTotal = Math.round(res.grandTotalCost * exchangeRate);
            const convertedMonthlyBurn = Math.round(res.teamMonthlyBurnRate * exchangeRate);
            const reg = REGIONS.find((r) => r.id === scen.state.regionId) || REGIONS[0];

            return (
              <div
                key={scen.id}
                className="bg-slate-800 rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden flex flex-col justify-between transition-all duration-200 hover:border-indigo-500/50"
              >
                <div>
                  {/* Header */}
                  <div className="p-4 bg-slate-900/60 border-b border-slate-700/50 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-100">{scen.name}</h4>
                      <p className="text-[10px] text-slate-400">
                        {reg.flag} {reg.name} • {scen.state.complexity.toUpperCase()} Tier
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveScenario(scen.id)}
                      className="p-1 text-slate-500 hover:text-red-400 transition-all duration-200 active:scale-[0.98]"
                      title="Delete Scenario"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Pricing Badge */}
                  <div className="p-5 border-b border-slate-700/50 bg-slate-900/30">
                    <div className="text-xs font-semibold text-slate-400">Estimated Total Cost</div>
                    <div className="text-3xl font-black text-emerald-500 my-0.5 tracking-tight">
                      {currencySymbol}{convertedGrandTotal.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      ~{currencySymbol}{Math.round(res.effectiveHourlyRate * exchangeRate)}/hr average labor rate
                    </div>
                  </div>

                  {/* Specs Matrix */}
                  <div className="p-5 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Timeline Schedule</span>
                      </span>
                      <span className="font-bold text-slate-100">
                        {res.estimatedTimelineWeeks} Weeks (~{res.estimatedTimelineMonths} mo)
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center space-x-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Monthly Team Burn</span>
                      </span>
                      <span className="font-bold text-emerald-500">
                        {currencySymbol}{convertedMonthlyBurn.toLocaleString()}/mo
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center space-x-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Squad Headcount</span>
                      </span>
                      <span className="font-bold text-slate-100">
                        {scen.state.team.reduce((acc, m) => acc + m.count, 0)} Roles Assigned
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center space-x-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Features Included</span>
                      </span>
                      <span className="font-bold text-slate-100">
                        {scen.state.selectedFeatureIds.length} Modules ({res.totalHours} hrs)
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center space-x-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Risk Buffer</span>
                      </span>
                      <span className="font-bold text-emerald-500">
                        +{scen.state.contingencyBufferPercent}% Contingency
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Load Button */}
                <div className="p-3 bg-slate-900/50 border-t border-slate-700/50">
                  <button
                    type="button"
                    onClick={() => onLoadState(scen.state)}
                    className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all duration-200 active:scale-[0.98] flex items-center justify-center space-x-1.5 shadow-md shadow-indigo-500/20"
                  >
                    <span>Load This Configuration</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
