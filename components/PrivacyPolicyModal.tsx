'use client';

import React from 'react';
import { X, ShieldCheck, Mail, CheckCircle2 } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div
        className="bg-slate-800 border border-slate-700/50 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-policy-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-slate-900/60">
          <div className="flex items-center space-x-2 text-slate-100">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <h2 id="privacy-policy-title" className="font-bold text-base">
              ScopeCraft — Privacy Policy & Terms of Use
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-all duration-200 active:scale-[0.98]"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-300 leading-relaxed">
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-200 space-y-1">
            <div className="font-bold flex items-center space-x-1.5 text-indigo-300">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
              <span>Complimentary Estimation Platform Guarantee</span>
            </div>
            <p className="text-slate-300">
              Access to this interactive estimation suite is 100% complimentary and imposes zero obligation or financial commitment. You will never lose anything by calculating budgets, timelines, and feature scopes. Formal vetting by a Senior Solutions Architect with a production execution plan is available as an entirely optional paid advisory service.
            </p>
          </div>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-100 text-sm">
              1. Information We Collect
            </h3>
            <p>
              When you use ScopeCraft, we collect information submitted voluntarily through our lead capture and scoping forms:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-400">
              <li><strong className="text-slate-200">Contact Information:</strong> Full name, corporate email address, and phone number.</li>
              <li><strong className="text-slate-200">Company Details:</strong> Company/organization name, professional role, and planned investment budget range.</li>
              <li><strong className="text-slate-200">Project Architecture Specifications:</strong> Selected platforms, architecture complexity tiers, selected functional modules, team squad configuration, and target delivery timelines.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-100 text-sm">
              2. How We Use Your Information & CRM Storage
            </h3>
            <p>
              Your contact details and technical project selections are transmitted to our customer relationship platform (GoHighLevel) and stored in our database for:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-400">
              <li>Generating your interactive cost calculations and downloadable Statement of Work (SOW) documents.</li>
              <li>Allowing our engineering and solution consulting teams to provide direct follow-up, answer technical architectural questions, and discuss project feasibility.</li>
              <li>Providing access to our optional Senior Solutions Architect vetting services should you request formal technical auditing.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-100 text-sm">
              3. Data Protection & Security
            </h3>
            <p className="text-slate-400">
              We take the security of your proprietary specifications seriously. All communications between your browser and our servers use industry-standard SSL/TLS encryption. We do not sell, rent, or trade your contact information to third-party advertisers or external marketing brokers.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-100 text-sm">
              4. Contact & Opt-Out
            </h3>
            <p className="text-slate-400">
              You may request deletion or modification of your lead records, or unsubscribe from consultative communications at any time by contacting us:
            </p>
            <div className="flex items-center space-x-2 text-xs text-indigo-400 font-medium pt-1">
              <Mail className="w-4 h-4" />
              <span>privacy@scopecraft.dev</span>
            </div>
          </section>

          <section className="space-y-2 pt-3 border-t border-slate-700/50">
            <h3 className="font-bold text-slate-100 text-sm">
              5. Open Source Software License & Copyright
            </h3>
            <p className="text-xs text-slate-400">
              ScopeCraft is open-source software licensed under the <strong className="text-slate-200">GNU General Public License v3.0 (GPLv3)</strong>. Copyright &copy; {new Date().getFullYear()} Phaedra Solutions. All rights reserved. You are free to inspect, run, modify, and redistribute the application under the terms of the GNU GPLv3.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-900/60 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Last updated: November 2026
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all duration-200 active:scale-[0.98] shadow-md shadow-indigo-500/20"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
