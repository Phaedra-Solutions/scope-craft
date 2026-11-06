'use client';

import React from 'react';
import { X, ShieldCheck, Mail, Lock, CheckCircle2 } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-policy-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2 text-slate-900">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h2 id="privacy-policy-title" className="font-bold text-base">
              ScopeCraft — Privacy Policy & Terms of Use
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-600 leading-relaxed">
          
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
            <div className="font-bold flex items-center space-x-1.5 text-blue-800">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-blue-600" />
              <span>Complimentary Estimation Platform Guarantee</span>
            </div>
            <p>
              Access to this interactive estimation suite is 100% complimentary and imposes zero obligation or financial commitment. You will never lose anything by calculating budgets, timelines, and feature scopes. Formal vetting by a Senior Solutions Architect with a production execution plan is available as an entirely optional paid advisory service.
            </p>
          </div>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">
              1. Information We Collect
            </h3>
            <p>
              When you use ScopeCraft, we collect information submitted voluntarily through our lead capture and scoping forms:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li><strong>Contact Information:</strong> Full name, corporate email address, and phone number.</li>
              <li><strong>Company Details:</strong> Company/organization name, professional role, and planned investment budget range.</li>
              <li><strong>Project Architecture Specifications:</strong> Selected platforms, architecture complexity tiers, selected functional modules, team squad configuration, and target delivery timelines.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">
              2. How We Use Your Information & CRM Storage
            </h3>
            <p>
              Your contact details and technical project selections are transmitted to our customer relationship platform (GoHighLevel) and stored in our database for:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>Generating your interactive cost calculations and downloadable Statement of Work (SOW) documents.</li>
              <li>Allowing our engineering and solution consulting teams to provide direct follow-up, answer technical architectural questions, and discuss project feasibility.</li>
              <li>Providing access to our optional Senior Solutions Architect vetting services should you request formal technical auditing.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">
              3. Data Protection & Security
            </h3>
            <p>
              We take the security of your proprietary specifications seriously. All communications between your browser and our servers use industry-standard SSL/TLS encryption. We do not sell, rent, or trade your contact information to third-party advertisers or external marketing brokers.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">
              4. Contact & Opt-Out
            </h3>
            <p>
              You may request deletion or modification of your lead records, or unsubscribe from consultative communications at any time by contacting us:
            </p>
            <div className="flex items-center space-x-2 text-xs text-blue-600 font-medium pt-1">
              <Mail className="w-4 h-4" />
              <span>privacy@phaedrasolutions.com</span>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Last updated: November 2026
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm"
          >
            I Understand
          </button>
        </div>

      </div>
    </div>
  );
};
