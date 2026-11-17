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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#DDE3E7] shadow-sm">
        <div>
          <h3 className="font-bold text-[#082A1C] text-lg lb-heading flex items-center space-x-2">
            <GitCompare className="w-5 h-5 text-[#082A1C]" />
            <span>Scenario Comparison Matrix</span>
          </h3>
          <p className="text-xs text-[#64707A] mt-0.5">
            Compare regional rates, team configurations, and delivery milestones side-by-side
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {scenarios.length > 0 && (
            <button
              type="button"
              onClick={handleExportScenariosCsv}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#082A1C] bg-[#F4F7F9] border border-[#DDE3E7] hover:border-[#082A1C]/40 transition-all duration-200 active:scale-[0.98]"
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
            className="px-3 py-2 text-xs bg-[#F4F7F9] focus:bg-white border border-[#DDE3E7] rounded-xl focus:outline-none focus:border-[#082A1C] text-[#082A1C] placeholder:text-[#64707A]/60 transition-all duration-200"
          />
          <button
            type="button"
            onClick={handleSaveCurrentAsScenario}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl lb-btn-primary font-bold text-xs active:scale-[0.98] shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Save Scenario</span>
          </button>
        </div>
      </div>

      {/* Comparison Grid */}
      {scenarios.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-[#DDE3E7] shadow-sm">
          <GitCompare className="w-10 h-10 text-[#64707A] mx-auto mb-2" />
          <p className="text-sm font-semibold text-[#082A1C]">No scenarios saved for comparison.</p>
          <p className="text-xs text-[#64707A] mt-1">Click &quot;Save Scenario&quot; above to snapshot your current setup.</p>
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
                className="bg-white rounded-2xl border border-[#DDE3E7] shadow-sm overflow-hidden flex flex-col justify-between transition-all duration-200 hover:border-[#082A1C]"
              >
                <div>
                  {/* Header */}
                  <div className="p-4 bg-[#F4F7F9] border-b border-[#DDE3E7] flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-[#082A1C]">{scen.name}</h4>
                      <p className="text-[10px] text-[#64707A]">
                        {reg.flag} {reg.name} • {scen.state.complexity.toUpperCase()} Tier
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveScenario(scen.id)}
                      className="p-1 text-[#64707A] hover:text-red-600 transition-all duration-200 active:scale-[0.98]"
                      title="Delete Scenario"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Pricing Badge */}
                  <div className="p-5 bg-[#082A1C] text-white">
                    <div className="text-xs font-mono uppercase tracking-wider text-[#94A3B8]">Estimated Total Cost</div>
                    <div className="text-3xl font-black text-[#CDFF8C] my-0.5 tracking-tight tabular-nums">
                      {currencySymbol}{convertedGrandTotal.toLocaleString()}
                    </div>
                    <div className="text-[10px] font-mono text-[#94A3B8] tabular-nums">
                      ~{currencySymbol}{Math.round(res.effectiveHourlyRate * exchangeRate)}/hr average labor rate
                    </div>
                  </div>

                  {/* Specs Matrix */}
                  <div className="p-5 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#64707A] flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#082A1C]" />
                        <span>Timeline Schedule</span>
                      </span>
                      <span className="font-bold text-[#082A1C] tabular-nums">
                        {res.estimatedTimelineWeeks} Weeks (~{res.estimatedTimelineMonths} mo)
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#64707A] flex items-center space-x-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-[#082A1C]" />
                        <span>Monthly Team Burn</span>
                      </span>
                      <span className="font-mono font-bold text-[#082A1C] tabular-nums">
                        {currencySymbol}{convertedMonthlyBurn.toLocaleString()}/mo
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#64707A] flex items-center space-x-1.5">
                        <Users className="w-3.5 h-3.5 text-[#082A1C]" />
                        <span>Squad Headcount</span>
                      </span>
                      <span className="font-bold text-[#082A1C] tabular-nums">
                        {scen.state.team.reduce((acc, m) => acc + m.count, 0)} Roles Assigned
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#64707A] flex items-center space-x-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#082A1C]" />
                        <span>Features Included</span>
                      </span>
                      <span className="font-bold text-[#082A1C] tabular-nums">
                        {scen.state.selectedFeatureIds.length} Modules ({res.totalHours} hrs)
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#64707A] flex items-center space-x-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#082A1C]" />
                        <span>Risk Buffer</span>
                      </span>
                      <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-[#CDFF8C] text-[#082A1C] tabular-nums">
                        +{scen.state.contingencyBufferPercent}% Contingency
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Load Button */}
                <div className="p-3 bg-[#F4F7F9] border-t border-[#DDE3E7]">
                  <button
                    type="button"
                    onClick={() => onLoadState(scen.state)}
                    className="w-full py-2.5 px-3 rounded-xl lb-btn-primary font-bold text-xs active:scale-[0.98] flex items-center justify-center space-x-1.5 shadow-sm"
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
