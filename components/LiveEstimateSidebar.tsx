'use client';

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ProjectState, EstimateResult } from '@/types/estimator';
import { REGIONS } from '@/lib/estimator-data';
import {
  FileText,
  Clock,
  Users,
  Layers,
  Lock,
  BookmarkPlus,
  TrendingUp,
  ShieldCheck,
  CalendarCheck,
  ArrowRight
} from 'lucide-react';

interface LiveEstimateSidebarProps {
  state: ProjectState;
  estimate: EstimateResult;
  currencySymbol: string;
  exchangeRate: number;
  isUnlocked: boolean;
  onOpenExportModal: () => void;
  onOpenPresetModal: () => void;
  onOpenBookingModal: () => void;
}

export const LiveEstimateSidebar: React.FC<LiveEstimateSidebarProps> = ({
  state,
  estimate,
  currencySymbol,
  exchangeRate,
  isUnlocked,
  onOpenExportModal,
  onOpenPresetModal,
  onOpenBookingModal
}) => {
  const shouldReduceMotion = useReducedMotion();
  const convertedGrandTotal = Math.round(estimate.grandTotalCost * exchangeRate);
  const convertedMonthlyBurn = Math.round(estimate.teamMonthlyBurnRate * exchangeRate);
  const convertedSaasMonthly = Math.round(estimate.monthlySaaSCost * exchangeRate);
  const totalHeadcount = state.team.reduce((acc, m) => acc + m.count, 0);
  const region = REGIONS.find((r) => r.id === state.regionId) || REGIONS[0];

  return (
    <aside className="hidden lg:flex lg:flex-col w-80 xl:w-96 flex-shrink-0 sticky top-0 h-screen bg-[#082A1C] text-white border-l border-[#16422F] overflow-y-auto no-scrollbar">
      <div className="p-6 flex flex-col justify-between min-h-full space-y-6">
        <div className="space-y-6">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#1A4733]">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#CDFF8C] block">
                Live Telemetry
              </span>
              <h2 className="text-base font-semibold text-white lb-heading">
                Real-Time Estimate
              </h2>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-[#0F3827] border border-[#1E4F3A] text-xs font-semibold text-[#CDFF8C] tabular-nums">
              {region.flag} {Math.round(region.rateMultiplier * 100)}%
            </span>
          </div>

          {/* Primary Cost Readout */}
          <div className="p-5 rounded-2xl bg-[#0F3827] border border-[#1E4F3A] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#94A3B8]">
                Total Est. Investment
              </span>
              {!isUnlocked && (
                <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-[#CDFF8C]">
                  <Lock className="w-3 h-3" />
                  <span>Step 5 Unlocks SOW</span>
                </span>
              )}
            </div>

            {isUnlocked ? (
              <>
                <div className="text-3xl xl:text-4xl font-semibold text-[#CDFF8C] tracking-tight tabular-nums">
                  {currencySymbol}{convertedGrandTotal.toLocaleString()}
                </div>
                <div className="text-[11px] text-[#94A3B8] tabular-nums">
                  Range: {currencySymbol}{Math.round(convertedGrandTotal * 0.92).toLocaleString()} – {currencySymbol}{Math.round(convertedGrandTotal * 1.12).toLocaleString()}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2 text-2xl font-semibold text-[#94A3B8] tracking-tight select-none tabular-nums">
                  <Lock className="w-5 h-5 text-[#CDFF8C] flex-shrink-0" />
                  <span>{currencySymbol} ••,•••</span>
                </div>
                <div className="text-[11px] text-[#94A3B8]">
                  Submit Step 5 lead form to unlock exact cost & SOW
                </div>
              </>
            )}
          </div>

          {/* Core Numerical Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-[#0F3827] border border-[#1E4F3A]">
              <div className="flex items-center space-x-1.5 text-[11px] font-medium text-[#94A3B8]">
                <TrendingUp className="w-3.5 h-3.5 text-[#CDFF8C]" />
                <span>Total Effort</span>
              </div>
              <div className="text-lg font-semibold text-white mt-1 tabular-nums">
                {estimate.totalHours.toLocaleString()} hrs
              </div>
              <div className="text-[10px] text-[#94A3B8] mt-0.5 tabular-nums">
                {state.selectedFeatureIds.length} active modules
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0F3827] border border-[#1E4F3A]">
              <div className="flex items-center space-x-1.5 text-[11px] font-medium text-[#94A3B8]">
                <Clock className="w-3.5 h-3.5 text-[#CDFF8C]" />
                <span>Timeline</span>
              </div>
              <div className="text-lg font-semibold text-white mt-1 tabular-nums">
                {estimate.estimatedTimelineWeeks} Weeks
              </div>
              <div className="text-[10px] text-[#94A3B8] mt-0.5 tabular-nums">
                ~{estimate.estimatedTimelineMonths} calendar mos
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0F3827] border border-[#1E4F3A]">
              <div className="flex items-center space-x-1.5 text-[11px] font-medium text-[#94A3B8]">
                <Users className="w-3.5 h-3.5 text-[#CDFF8C]" />
                <span>Monthly Burn</span>
              </div>
              {isUnlocked ? (
                <div className="text-base font-semibold text-[#CDFF8C] mt-1 tabular-nums">
                  {currencySymbol}{convertedMonthlyBurn.toLocaleString()}
                </div>
              ) : (
                <div className="text-base font-semibold text-[#94A3B8] mt-1 flex items-center space-x-1.5 select-none">
                  <Lock className="w-3.5 h-3.5 text-[#CDFF8C] flex-shrink-0" />
                  <span>Locked</span>
                </div>
              )}
              <div className="text-[10px] text-[#94A3B8] mt-0.5 tabular-nums">
                {totalHeadcount} squad specialists
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0F3827] border border-[#1E4F3A]">
              <div className="flex items-center space-x-1.5 text-[11px] font-medium text-[#94A3B8]">
                <Layers className="w-3.5 h-3.5 text-[#CDFF8C]" />
                <span>Cloud Infra</span>
              </div>
              {isUnlocked ? (
                <div className="text-base font-semibold text-[#CDFF8C] mt-1 tabular-nums">
                  {currencySymbol}{convertedSaasMonthly.toLocaleString()}/mo
                </div>
              ) : (
                <div className="text-base font-semibold text-[#94A3B8] mt-1 flex items-center space-x-1.5 select-none">
                  <Lock className="w-3.5 h-3.5 text-[#CDFF8C] flex-shrink-0" />
                  <span>Locked</span>
                </div>
              )}
              <div className="text-[10px] text-[#94A3B8] mt-0.5 tabular-nums">
                {state.selectedSaaSAddons.length} SaaS services
              </div>
            </div>
          </div>

          {/* Architecture Summary */}
          <div className="p-4 rounded-xl bg-[#062015] border border-[#1A4733] space-y-2.5 text-xs">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              Active Architecture Spec
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#94A3B8]">Platforms</span>
              <span className="font-semibold text-white">
                {state.platforms.length > 0 ? state.platforms.join(', ').toUpperCase() : 'None selected'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#94A3B8]">Complexity</span>
              <span className="font-semibold text-white capitalize">
                {state.complexity}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#94A3B8]">UI/UX Fidelity</span>
              <span className="font-semibold text-white capitalize">
                {state.designLevel.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#94A3B8]">Risk Buffer</span>
              <span className="font-semibold text-[#CDFF8C] tabular-nums">
                +{state.contingencyBufferPercent}%
              </span>
            </div>
          </div>

          {/* Phase Cost Preview */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
              <span>Phase Distribution</span>
              <span className="text-[#CDFF8C] tabular-nums">{estimate.totalHours}h</span>
            </div>
            <div className="space-y-2">
              {estimate.phaseBreakdown.map((phase) => (
                <div key={phase.phase} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/90 truncate pr-2">
                      {phase.phase.replace(/^\d+\.\s*/, '')}
                    </span>
                    {isUnlocked ? (
                      <span className="font-semibold text-[#CDFF8C] flex-shrink-0 tabular-nums">
                        {currencySymbol}{Math.round(phase.cost * exchangeRate).toLocaleString()}
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 font-medium text-[#94A3B8] flex-shrink-0 select-none">
                        <Lock className="w-3 h-3 text-[#CDFF8C]" />
                        <span>Locked</span>
                      </span>
                    )}
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#133D2B] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#CDFF8C] transition-all duration-300"
                      style={{ width: `${phase.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky Sidebar Actions */}
        <div className="pt-4 border-t border-[#1A4733] space-y-3">
          {/* Prominent Animated Next Step Booking CTA */}
          <div className="p-3.5 rounded-xl bg-[#0F3827] border border-[#CDFF8C]/35 space-y-2.5">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#CDFF8C] block">
                Next Step · Consultation
              </span>
              <p className="text-xs font-semibold text-white mt-0.5 leading-snug">
                Discuss Project Build or Book a Solutions Architect
              </p>
            </div>
            <motion.button
              type="button"
              onClick={onOpenBookingModal}
              whileHover={shouldReduceMotion ? undefined : { y: -1.5, scale: 1.015 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="group relative overflow-hidden w-full inline-flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-xs font-bold lb-btn-lime shadow-md cursor-pointer whitespace-nowrap"
            >
              {!shouldReduceMotion && (
                <motion.span
                  aria-hidden="true"
                  initial={{ x: '-120%' }}
                  animate={{ x: '220%' }}
                  transition={{
                    repeat: Infinity,
                    repeatDelay: 3.4,
                    duration: 1.15,
                    ease: 'easeInOut'
                  }}
                  className="pointer-events-none absolute inset-y-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/45 to-transparent"
                />
              )}
              <CalendarCheck className="w-4 h-4 flex-shrink-0" />
              <span>Book Appointment</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 flex-shrink-0" />
            </motion.button>
          </div>

          {isUnlocked ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={onOpenPresetModal}
                className="w-full inline-flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#0F3827] hover:bg-[#194F38] border border-[#1E4F3A] transition-all duration-200 active:scale-[0.98] cursor-pointer whitespace-nowrap"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-[#CDFF8C]" />
                <span>Load Industry Presets</span>
              </button>
              <button
                type="button"
                onClick={onOpenExportModal}
                className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#062015] hover:bg-[#133D2B] border border-[#1E4F3A] transition-all duration-200 active:scale-[0.98] cursor-pointer whitespace-nowrap"
              >
                <FileText className="w-4 h-4 text-[#CDFF8C]" />
                <span>Export Formal SOW</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-[#062015] border border-[#1A4733] text-[11px] text-[#94A3B8]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#CDFF8C] flex-shrink-0" />
              <span>Complete Step 5 to Export SOW</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
