'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { ProjectState, EstimateResult } from '@/types/estimator';
import {
  X,
  CalendarCheck,
  ShieldCheck,
  Code2,
  ExternalLink,
  Loader2,
  Clock,
  Layers
} from 'lucide-react';

const BOOKING_IFRAME_SRC = 'https://ghl.phaedrasolutions.com/widget/group/sshq3yagns4X1GpiR904';
const BOOKING_IFRAME_ID = 'sshq3yagns4X1GpiR904_1795590831927';
const BOOKING_EMBED_SCRIPT_SRC = 'https://ghl.phaedrasolutions.com/js/form_embed.js';

interface BookingConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: ProjectState;
  estimate: EstimateResult;
  currencySymbol: string;
  exchangeRate: number;
  isUnlocked: boolean;
}

interface BookingModalBodyProps {
  onClose: () => void;
  state: ProjectState;
  estimate: EstimateResult;
  currencySymbol: string;
  exchangeRate: number;
  isUnlocked: boolean;
}

const BookingModalBody: React.FC<BookingModalBodyProps> = ({
  onClose,
  state,
  estimate,
  currencySymbol,
  exchangeRate,
  isUnlocked
}) => {
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Ensure GHL form_embed.js is loaded once (its global message handler auto-registers new iframes)
    if (!document.querySelector(`script[src="${BOOKING_EMBED_SCRIPT_SRC}"]`)) {
      const script = document.createElement('script');
      script.src = BOOKING_EMBED_SCRIPT_SRC;
      script.type = 'text/javascript';
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const convertedGrandTotal = Math.round(estimate.grandTotalCost * exchangeRate);
  const hasScope = state.selectedFeatureIds.length > 0 || state.platforms.length > 0;

  return (
    <motion.div
      key="booking-modal-backdrop"
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
      className="fixed inset-0 z-50 bg-[#082A1C]/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      <motion.div
        key="booking-modal-panel"
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.985 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-[#DDE3E7] rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl my-auto flex flex-col"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-[#DDE3E7] bg-[#082A1C] text-white flex items-start justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 rounded-xl bg-[#CDFF8C] text-[#082A1C] flex-shrink-0 mt-0.5">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#CDFF8C]">
                Next Step · Discovery &amp; Architecture Consultation
              </div>
              <h2
                id="booking-modal-title"
                className="text-lg sm:text-xl font-bold text-white lb-heading mt-0.5"
              >
                Book an Appointment With Our Engineering Team
              </h2>
              <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
                Schedule a session to discuss building your project or engage our Principal Solutions Architect services.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close booking modal"
            className="p-2 text-[#94A3B8] hover:text-white hover:bg-[#0F3827] rounded-xl transition-all duration-200 active:scale-[0.98] flex-shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scope Context & Consultation Track Strip */}
        <div className="px-5 sm:px-6 py-4 bg-[#F4F7F9] border-b border-[#DDE3E7] space-y-3">
          {hasScope && (
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#DDE3E7] text-xs">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[#64707A]">
                <span className="font-semibold text-[#082A1C]">
                  {state.projectName || 'Custom Scope Session'}
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center space-x-1 tabular-nums">
                  <Layers className="w-3.5 h-3.5 text-[#082A1C]" />
                  <span>{state.selectedFeatureIds.length} modules</span>
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center space-x-1 tabular-nums">
                  <Clock className="w-3.5 h-3.5 text-[#082A1C]" />
                  <span>{estimate.estimatedTimelineWeeks} wks ({estimate.totalHours}h)</span>
                </span>
              </div>

              {isUnlocked && (
                <div className="font-mono font-bold text-[#082A1C] tabular-nums">
                  Est. {currencySymbol}{convertedGrandTotal.toLocaleString()}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white border border-[#DDE3E7] flex items-start space-x-2.5">
              <Code2 className="w-4 h-4 text-[#082A1C] flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[#082A1C]">Project Development Discussion</div>
                <p className="text-[11px] text-[#64707A] mt-0.5 leading-snug">
                  Review scope milestones, dedicated squad allocation, and launch timelines.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[#DDE3E7] flex items-start space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-[#082A1C] flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[#082A1C]">Solutions Architect Services</div>
                <p className="text-[11px] text-[#64707A] mt-0.5 leading-snug">
                  Audit your technical architecture, cloud infrastructure, security, and risk buffers.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Embedded GHL Booking Form */}
        <div className="p-4 sm:p-6 bg-white flex-1">
          <div className="relative rounded-xl border border-[#DDE3E7] bg-white overflow-hidden min-h-[720px]">
            {!isIframeLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F4F7F9]/80 z-10 space-y-3 p-6 text-center">
                <Loader2 className="w-7 h-7 text-[#082A1C] animate-spin" />
                <div>
                  <p className="text-sm font-semibold text-[#082A1C]">
                    Loading Appointment Calendar...
                  </p>
                  <p className="text-xs text-[#64707A] mt-0.5">
                    Connecting securely to our scheduling portal.
                  </p>
                </div>
              </div>
            )}

            <iframe
              src={BOOKING_IFRAME_SRC}
              allow="payment"
              style={{ width: '100%', border: 'none', overflow: 'hidden', minHeight: '720px' }}
              scrolling="no"
              id={BOOKING_IFRAME_ID}
              title="Book Project Development or Solutions Architect Appointment"
              onLoad={() => setIsIframeLoaded(true)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 bg-[#F4F7F9] border-t border-[#DDE3E7] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <a
            href={BOOKING_IFRAME_SRC}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 text-[#64707A] hover:text-[#082A1C] font-medium transition-colors"
          >
            <span>Open booking form in a separate tab</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl font-semibold text-xs text-[#082A1C] bg-white border border-[#DDE3E7] hover:border-[#082A1C] transition-all duration-200 active:scale-[0.98] cursor-pointer whitespace-nowrap shrink-0"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const BookingConsultationModal: React.FC<BookingConsultationModalProps> = ({
  isOpen,
  onClose,
  state,
  estimate,
  currencySymbol,
  exchangeRate,
  isUnlocked
}) => {
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <BookingModalBody
          key="booking-modal-body"
          onClose={onClose}
          state={state}
          estimate={estimate}
          currencySymbol={currencySymbol}
          exchangeRate={exchangeRate}
          isUnlocked={isUnlocked}
        />
      )}
    </AnimatePresence>
  );
};
