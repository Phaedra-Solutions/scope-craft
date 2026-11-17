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
  engineering: '#082A1C', // deep forest primary
  design: '#2D6A4F',      // mid forest sage
  management: '#64707A',  // cool slate muted
  qa_devops: '#95D5B2'    // soft mint-lime accent
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
        <div className="bg-[#F4F7F9] rounded-2xl p-6 border border-[#DDE3E7] animate-pulse h-80" />
        <div className="bg-[#F4F7F9] rounded-2xl p-6 border border-[#DDE3E7] animate-pulse h-80" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Role Breakdown Pie Chart */}
      <div className="bg-white rounded-2xl p-6 border border-[#DDE3E7]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-[#082A1C] text-sm lb-heading">
              Cost Allocation by Discipline
            </h3>
            <p className="text-xs text-[#64707A]">
              Distribution across development team specializations
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#CDFF8C] text-[#082A1C] tabular-nums">
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
                  stroke="none"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: unknown) => [formatMoney(Number(value)), 'Estimated Cost']}
                  contentStyle={{
                    backgroundColor: '#082A1C',
                    borderColor: '#1E4F3A',
                    borderRadius: '10px',
                    color: '#FFFFFF',
                    boxShadow: '0 10px 15px -3px rgb(8 42 28 / 0.25)',
                    fontSize: '12px'
                  }}
                  itemStyle={{ color: '#CDFF8C', fontWeight: 700 }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-[#64707A]">
              No active team roles assigned
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-[#DDE3E7]">
          {pieData.map((item) => (
            <div key={item.category} className="flex items-center space-x-2 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: CATEGORY_COLORS[item.category] }}
              />
              <span className="text-[#64707A] truncate">{item.name}:</span>
              <span className="font-semibold text-[#082A1C] ml-auto tabular-nums">
                {formatMoney(item.value)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Phase Milestone Bar Chart */}
      <div className="bg-white rounded-2xl p-6 border border-[#DDE3E7]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-[#082A1C] text-sm lb-heading">
              Milestone Payment Schedule
            </h3>
            <p className="text-xs text-[#64707A]">
              Project delivery phases and billing milestones
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#F4F7F9] text-[#082A1C] border border-[#DDE3E7] tabular-nums">
            {estimate.totalHours} Dev Hours
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DDE3E7" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#64707A' }}
                interval={0}
                angle={-15}
                textAnchor="end"
                stroke="#DDE3E7"
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64707A' }}
                tickFormatter={(val) => `${currencySymbol}${(val / 1000).toFixed(0)}k`}
                stroke="#DDE3E7"
              />
              <Tooltip
                formatter={(value: unknown) => [formatMoney(Number(value)), 'Phase Allocation']}
                contentStyle={{
                  backgroundColor: '#082A1C',
                  borderColor: '#1E4F3A',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  boxShadow: '0 10px 15px -3px rgb(8 42 28 / 0.25)',
                  fontSize: '12px'
                }}
                itemStyle={{ color: '#CDFF8C', fontWeight: 700 }}
                cursor={{ fill: 'rgba(8, 42, 28, 0.06)' }}
              />
              <Bar dataKey="cost" fill="#082A1C" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Phase Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 pt-3 border-t border-[#DDE3E7] text-[11px] text-center">
          {barData.map((phase) => (
            <div key={phase.name} className="p-2 rounded-lg bg-[#F4F7F9] border border-[#DDE3E7]">
              <span className="text-[#64707A] block truncate">{phase.name}</span>
              <span className="font-semibold text-[#082A1C] tabular-nums">{formatMoney(phase.cost)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
