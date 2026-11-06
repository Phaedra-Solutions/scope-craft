'use client';

import React, { useSyncExternalStore } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { EstimateResult, RoleCategory } from '@/types/estimator';

interface CostChartsProps {
  estimate: EstimateResult;
  currencySymbol: string;
  exchangeRate: number;
}

const CATEGORY_COLORS: Record<RoleCategory, string> = {
  engineering: '#2563eb', // royal blue
  design: '#0ea5e9', // sky blue
  management: '#6366f1', // indigo
  qa_devops: '#059669' // emerald
};

const CATEGORY_NAMES: Record<RoleCategory, string> = {
  engineering: 'Engineering & Dev',
  design: 'UI/UX Design',
  management: 'Architecture & PM',
  qa_devops: 'QA & DevOps'
};

const emptySubscribe = () => () => {};

export const CostCharts: React.FC<CostChartsProps> = ({ estimate, currencySymbol, exchangeRate }) => {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const pieData = (Object.keys(estimate.costByRoleCategory) as RoleCategory[])
    .map((cat) => {
      const rawCost = estimate.costByRoleCategory[cat];
      const convertedCost = Math.round(rawCost * exchangeRate);
      return {
        name: CATEGORY_NAMES[cat],
        value: convertedCost,
        category: cat,
        raw: rawCost
      };
    })
    .filter((item) => item.value > 0);

  const barData = estimate.phaseBreakdown.map((phase) => ({
    name: phase.phase.replace(/^\d+\.\s*/, ''),
    cost: Math.round(phase.cost * exchangeRate),
    hours: phase.hours
  }));

  const formatMoney = (val: number) => `${currencySymbol}${val.toLocaleString()}`;

  if (!isClient) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs animate-pulse h-80" />
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs animate-pulse h-80" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Role Breakdown Pie Chart */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Cost Allocation by Discipline
            </h3>
            <p className="text-xs text-slate-500">
              Distribution across development team specializations
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            {formatMoney(Math.round(estimate.baseLaborCost * exchangeRate))} Base Labor
          </span>
        </div>

        <div className="h-64 w-full">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [formatMoney(Number(value)), 'Estimated Cost']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '8px',
                    color: '#0f172a',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No active team roles assigned
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100">
          {pieData.map((item) => (
            <div key={item.category} className="flex items-center space-x-2 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: CATEGORY_COLORS[item.category] }}
              />
              <span className="text-slate-600 truncate">{item.name}:</span>
              <span className="font-bold text-slate-900 ml-auto">
                {formatMoney(item.value)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Phase Milestone Bar Chart */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Milestone Payment Schedule
            </h3>
            <p className="text-xs text-slate-500">
              Project delivery phases and billing milestones
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {estimate.totalHours} Dev Hours
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#64748b' }}
                interval={0}
                angle={-15}
                textAnchor="end"
                stroke="#cbd5e1"
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(val) => `${currencySymbol}${(val / 1000).toFixed(0)}k`}
                stroke="#cbd5e1"
              />
              <Tooltip
                formatter={(value: any) => [formatMoney(Number(value)), 'Phase Allocation']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '8px',
                  color: '#0f172a',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="cost" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Phase Summary Strip */}
        <div className="grid grid-cols-4 gap-2 mt-2 pt-3 border-t border-slate-100 text-[11px] text-center">
          {barData.map((phase) => (
            <div key={phase.name} className="p-1 rounded bg-slate-50">
              <span className="text-slate-500 block truncate">{phase.name}</span>
              <span className="font-bold text-slate-900">{formatMoney(phase.cost)}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
