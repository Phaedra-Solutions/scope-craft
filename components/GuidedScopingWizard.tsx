'use client';

import React, { useState } from 'react';
import {
  ProjectState,
  ProjectPlatform,
  ComplexityLevel,
  DesignLevel,
  LeadProfile,
  EstimateResult
} from '@/types/estimator';
import { FEATURE_CATALOG, SAAS_ADDONS, REGIONS, TEAM_ROLES } from '@/lib/estimator-data';
import { calculateEstimate, generateRecommendedTeam } from '@/lib/estimator-engine';
import { sendLeadToGHL } from '@/lib/ghl-sync';
import { PrivacyPolicyModal } from '@/components/PrivacyPolicyModal';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Unlock,
  ShieldCheck,
  Globe2,
  Users,
  Code2,
  Smartphone,
  Laptop,
  Layers,
  Building2,
  Mail,
  User,
  Phone,
  Briefcase,
  DollarSign,
  Plus,
  Minus,
  Check
} from 'lucide-react';

interface GuidedScopingWizardProps {
  initialState: ProjectState;
  onComplete: (lead: LeadProfile, updatedState: ProjectState) => void;
  onStateChange?: (updated: Partial<ProjectState>) => void;
  currencySymbol: string;
  exchangeRate: number;
}

export const GuidedScopingWizard: React.FC<GuidedScopingWizardProps> = ({
  initialState,
  onComplete,
  onStateChange,
  currencySymbol,
  exchangeRate
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [internalState, setInternalState] = useState<ProjectState>(initialState);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const state = onStateChange ? initialState : internalState;

  // Lead Form State
  const [leadForm, setLeadForm] = useState<{
    fullName: string;
    email: string;
    phone: string;
    company: string;
    role: string;
    budgetRange: string;
    wantsOptionalPaidReview: boolean;
    consentGiven: boolean;
  }>({
    fullName: '',
    email: '',
    phone: '',
    company: state.clientName || '',
    role: 'Founder / C-Level Executive',
    budgetRange: '$50k - $100k',
    wantsOptionalPaidReview: false,
    consentGiven: false
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Helper to update wizard project state
  const updateState = (updates: Partial<ProjectState>) => {
    if (onStateChange) {
      onStateChange(updates);
    } else {
      setInternalState((prev) => ({ ...prev, ...updates }));
    }
  };

  // Toggle platform selection
  const handleTogglePlatform = (platform: ProjectPlatform) => {
    const current = [...state.platforms];
    const exists = current.includes(platform);
    let updated: ProjectPlatform[];
    if (exists) {
      if (current.length === 1) return;
      updated = current.filter((p) => p !== platform);
    } else {
      updated = [...current, platform];
    }
    const recTeam = generateRecommendedTeam(state.selectedFeatureIds, updated, state.complexity, state.designLevel);
    updateState({ platforms: updated, team: recTeam });
  };

  // Toggle feature selection
  const handleToggleFeature = (featureId: string) => {
    const current = [...state.selectedFeatureIds];
    const exists = current.includes(featureId);
    const updated = exists ? current.filter((id) => id !== featureId) : [...current, featureId];
    const recTeam = generateRecommendedTeam(updated, state.platforms, state.complexity, state.designLevel);
    updateState({ selectedFeatureIds: updated, team: recTeam });
  };

  // Toggle SaaS add-on selection
  const handleToggleSaaS = (addonId: string) => {
    const current = [...state.selectedSaaSAddons];
    const exists = current.includes(addonId);
    const updated = exists ? current.filter((id) => id !== addonId) : [...current, addonId];
    updateState({ selectedSaaSAddons: updated });
  };

  // Adjust role count in Step 3
  const handleUpdateRoleCount = (roleId: string, delta: number) => {
    const currentTeam = [...state.team];
    const itemIndex = currentTeam.findIndex((m) => m.roleId === roleId);
    if (itemIndex > -1) {
      const newCount = Math.max(0, currentTeam[itemIndex].count + delta);
      if (newCount === 0) {
        currentTeam.splice(itemIndex, 1);
      } else {
        currentTeam[itemIndex] = { ...currentTeam[itemIndex], count: newCount };
      }
    } else if (delta > 0) {
      currentTeam.push({
        id: `team_${roleId}_${currentTeam.length + 1}`,
        roleId,
        count: 1,
        experienceLevel: 'senior',
        engagement: 'fulltime'
      });
    }
    updateState({ team: currentTeam });
  };

  // Validate Step 4 Lead Form
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!leadForm.fullName.trim()) errors.fullName = 'Full Name is required';
    if (!leadForm.email.trim()) {
      errors.email = 'Work Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadForm.email.trim())) {
      errors.email = 'Please enter a valid business email address';
    }
    if (!leadForm.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (leadForm.phone.trim().length < 7) {
      errors.phone = 'Please enter a valid phone number';
    }
    if (!leadForm.company.trim()) errors.company = 'Company name is required';
    if (!leadForm.consentGiven) {
      errors.consent = 'Please confirm consent to proceed with your estimate';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle final Step 4 submission
  const handleSubmitLeadAndReveal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const leadProfile: LeadProfile = {
      fullName: leadForm.fullName.trim(),
      email: leadForm.email.trim().toLowerCase(),
      phone: leadForm.phone.trim(),
      company: leadForm.company.trim(),
      role: leadForm.role,
      budgetRange: leadForm.budgetRange,
      marketingConsent: leadForm.consentGiven,
      privacyAccepted: true,
      submittedAt: new Date().toISOString(),
      wantsOptionalPaidReview: leadForm.wantsOptionalPaidReview
    };

    const updatedState: ProjectState = {
      ...state,
      clientName: leadForm.company.trim(),
      projectName: state.projectName || `${leadForm.company.trim()} Platform`
    };

    const estimate: EstimateResult = calculateEstimate(updatedState);

    try {
      await sendLeadToGHL(leadProfile, updatedState, estimate, 'lead_created', 'guided_wizard_reveal');
      try {
        localStorage.setItem('scopecraft_lead_profile', JSON.stringify(leadProfile));
        localStorage.setItem('scopecraft_unlocked_lead', 'true');
      } catch {
        // storage quota fallback
      }
      onComplete(leadProfile, updatedState);
    } catch (err) {
      console.error('Lead submission failed:', err);
      setSubmitError('Unable to sync with CRM. Your calculation will still unlock now.');
      onComplete(leadProfile, updatedState);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredFeatures = FEATURE_CATALOG.filter((f) => {
    if (activeCategory === 'all') return true;
    return f.category === activeCategory;
  });

  const categories = [
    { id: 'all', name: 'All Modules' },
    { id: 'auth', name: 'Auth & Access' },
    { id: 'monetization', name: 'Payments & Billing' },
    { id: 'ai_ml', name: 'AI & Intelligence' },
    { id: 'communication', name: 'Real-Time & Chat' },
    { id: 'content_cms', name: 'CMS & Content' },
    { id: 'analytics_data', name: 'Data & Analytics' },
    { id: 'security_compliance', name: 'Security & SLA' }
  ];

  const activeRegion = REGIONS.find((r) => r.id === state.regionId) || REGIONS[0];

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6">
      {/* Top Wizard Banner & Flat Minimalist Multi-Step Navigation */}
      <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-6 sm:p-8 shadow-xl mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-700/50">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-400 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>ScopeCraft Precision Scoping</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
              Software Cost & Team Estimator
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Configure your architecture, modules, and engineering squad to compute transparent project costs.
            </p>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900/80 text-slate-300 border border-slate-700/50">
              Step {currentStep} of 4
            </span>
          </div>
        </div>

        {/* Rule 1: Multi-Step Navigation (Flat Minimalism) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          {[
            { step: 1, label: '01. Foundations', desc: 'Platforms & Scale' },
            { step: 2, label: '02. Modules', desc: 'Core Functionality' },
            { step: 3, label: '03. Team & Rates', desc: 'Squad & Benchmarks' },
            { step: 4, label: '04. Unlock SOW', desc: 'Full Calculation' }
          ].map((item) => {
            const isPassed = currentStep > item.step;
            const isCurrent = currentStep === item.step;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => {
                  if (item.step < currentStep || isPassed) {
                    setCurrentStep(item.step as 1 | 2 | 3 | 4);
                  }
                }}
                disabled={item.step > currentStep}
                className={`text-left pb-3 pt-1 border-b-2 transition-all duration-200 ${
                  isCurrent
                    ? 'border-indigo-500 text-slate-100'
                    : isPassed
                    ? 'border-emerald-500 text-emerald-400 hover:text-emerald-300 cursor-pointer active:scale-[0.98]'
                    : 'border-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-bold tracking-tight ${
                      isCurrent ? 'text-slate-100' : isPassed ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {item.label}
                  </span>
                  {isPassed && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                </div>
                <p className={`text-[11px] leading-tight ${isCurrent ? 'text-slate-300' : 'text-slate-500'}`}>
                  {item.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 1: Foundations & Platforms */}
      {currentStep === 1 && (
        <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-6 sm:p-8 shadow-xl space-y-8">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>Project Foundations & Deployment Platforms</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Specify your project identification, target platforms, architecture scale, and design fidelity.
            </p>
          </div>

          {/* Project & Client Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Project Title
              </label>
              <input
                type="text"
                value={state.projectName}
                onChange={(e) => updateState({ projectName: e.target.value })}
                placeholder="e.g. Enterprise SaaS Platform"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700/50 bg-slate-900/70 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Company / Organization
              </label>
              <input
                type="text"
                value={state.clientName}
                onChange={(e) => updateState({ clientName: e.target.value })}
                placeholder="e.g. Acme Corporation"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700/50 bg-slate-900/70 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-all duration-200"
              />
            </div>
          </div>

          {/* Target Platforms Matrix Cards (Rule 2: No raw checkboxes/radios) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-3">
              Select Target Platforms (Multi-Select)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: 'web' as ProjectPlatform, name: 'Web Application', icon: Laptop, desc: 'Responsive SaaS & Cloud Portal' },
                { id: 'ios' as ProjectPlatform, name: 'iOS Native', icon: Smartphone, desc: 'Swift, SwiftUI & Apple App Store' },
                { id: 'android' as ProjectPlatform, name: 'Android Native', icon: Smartphone, desc: 'Kotlin, Jetpack & Google Play' },
                { id: 'cross_platform' as ProjectPlatform, name: 'Cross-Platform Mobile', icon: Code2, desc: 'React Native / Flutter Shared Core' },
                { id: 'desktop' as ProjectPlatform, name: 'Desktop Suite', icon: Laptop, desc: 'Electron / Tauri Native Binary' }
              ].map((p) => {
                const active = state.platforms.includes(p.id);
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => handleTogglePlatform(p.id)}
                    className={`p-4 rounded-xl text-left flex items-center justify-between gap-3 transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                      active
                        ? 'bg-slate-800/80 border-2 border-indigo-500 shadow-md shadow-indigo-500/5'
                        : 'bg-slate-800/40 border-2 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      <div
                        className={`p-2.5 rounded-lg border ${
                          active
                            ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-400'
                            : 'bg-slate-900/60 border-slate-700/50 text-slate-400'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-slate-100">{p.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5 leading-tight">{p.desc}</div>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                        active ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 bg-slate-900/50'
                      }`}
                    >
                      {active && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Architecture Complexity Matrix Cards (Rule 2: No raw radio inputs) */}
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-3">
                Architecture Complexity
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="radiogroup" aria-label="Architecture Complexity">
                {[
                  { id: 'mvp' as ComplexityLevel, title: 'MVP / Fast Prototype', mult: '0.90x', desc: 'Core feature validation, rapid market launch.' },
                  { id: 'standard' as ComplexityLevel, title: 'Production Standard', mult: '1.18x', desc: 'Full multi-tenant architecture, robust API suite.' },
                  { id: 'enterprise' as ComplexityLevel, title: 'Enterprise Scaled', mult: '1.55x', desc: 'High concurrency, compliance, automated QA pipelines.' }
                ].map((tier) => {
                  const active = state.complexity === tier.id;
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => updateState({ complexity: tier.id })}
                      className={`p-4 rounded-xl text-left transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-start justify-between gap-3 ${
                        active
                          ? 'bg-slate-800/80 border-2 border-indigo-500 shadow-md shadow-indigo-500/5'
                          : 'bg-slate-800/40 border-2 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-slate-100">{tier.title}</span>
                          <span className="text-[11px] font-semibold text-emerald-500">{tier.mult}</span>
                        </div>
                        <div className="text-xs text-slate-400 leading-relaxed mt-1">{tier.desc}</div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          active ? 'border-indigo-500 bg-indigo-500/20' : 'border-slate-700'
                        }`}
                      >
                        {active && <div className="w-2 h-2 rounded-full bg-indigo-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Design & UI/UX Fidelity Matrix Cards (Rule 2: No raw radio inputs) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-3">
                Design & UI/UX Fidelity
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="radiogroup" aria-label="Design and UI/UX Fidelity">
                {[
                  { id: 'wireframe' as DesignLevel, title: 'Wireframes / System UI', mult: '+8%', desc: 'Functional component library, clean system patterns.' },
                  { id: 'standard_ui' as DesignLevel, title: 'Polished Brand UI', mult: '+18%', desc: 'Custom iconography, responsive components & brand styling.' },
                  { id: 'custom_bespoke' as DesignLevel, title: 'Bespoke Luxury Experience', mult: '+30%', desc: 'Custom micro-interactions, motion design & Figma library.' }
                ].map((tier) => {
                  const active = state.designLevel === tier.id;
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => updateState({ designLevel: tier.id })}
                      className={`p-4 rounded-xl text-left transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-start justify-between gap-3 ${
                        active
                          ? 'bg-slate-800/80 border-2 border-indigo-500 shadow-md shadow-indigo-500/5'
                          : 'bg-slate-800/40 border-2 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-slate-100">{tier.title}</span>
                          <span className="text-[11px] font-semibold text-emerald-500">{tier.mult}</span>
                        </div>
                        <div className="text-xs text-slate-400 leading-relaxed mt-1">{tier.desc}</div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          active ? 'border-indigo-500 bg-indigo-500/20' : 'border-slate-700'
                        }`}
                      >
                        {active && <div className="w-2 h-2 rounded-full bg-indigo-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Step 1 Actions */}
          <div className="flex justify-end pt-4 border-t border-slate-700/50">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20 transition-all duration-200 active:scale-[0.98]"
            >
              <span>Continue to Modules (Step 2)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Feature Modules Catalog */}
      {currentStep === 2 && (
        <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
                <Code2 className="w-5 h-5 text-indigo-400" />
                <span>Select Feature Modules & Add-ons</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Choose the technical features required for your platform.
              </p>
            </div>
            <div className="px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 font-semibold text-xs border border-indigo-500/30 self-start sm:self-auto">
              <span className="text-emerald-500 font-bold">{state.selectedFeatureIds.length}</span> Modules Selected
            </div>
          </div>

          {/* Category Filter Tabs (Flat Minimalism) */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1 border-b border-slate-800 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`pb-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all duration-200 active:scale-[0.98] ${
                  activeCategory === cat.id
                    ? 'border-indigo-500 text-slate-100'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Feature Matrix Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredFeatures.map((feat) => {
              const active = state.selectedFeatureIds.includes(feat.id);
              return (
                <button
                  key={feat.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleToggleFeature(feat.id)}
                  className={`p-4 rounded-xl text-left flex flex-col justify-between space-y-2.5 transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                    active
                      ? 'bg-slate-800/80 border-2 border-indigo-500 shadow-md shadow-indigo-500/5'
                      : 'bg-slate-800/40 border-2 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 w-full">
                    <span className="font-bold text-xs text-slate-100 leading-snug">
                      {feat.name}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-900/70 text-emerald-500 border border-slate-700/50 whitespace-nowrap">
                      +{feat.baseHours} hrs
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                    {feat.description}
                  </p>
                  <div className="flex items-center justify-between w-full pt-2 border-t border-slate-700/50 text-[11px]">
                    <span className="capitalize text-slate-500">{feat.category.replace('_', ' ')}</span>
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-200 ${
                        active ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 bg-slate-900/50'
                      }`}
                    >
                      {active && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Cloud & Managed Infrastructure Services */}
          <div className="pt-4 border-t border-slate-700/50">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Optional Cloud Services & Infrastructure Subscriptions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SAAS_ADDONS.map((addon) => {
                const active = state.selectedSaaSAddons.includes(addon.id);
                const estMonthly = Math.round(addon.monthlyEstimate * exchangeRate);
                return (
                  <button
                    key={addon.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => handleToggleSaaS(addon.id)}
                    className={`p-3.5 rounded-xl text-left flex items-center justify-between transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                      active
                        ? 'bg-slate-800/80 border-2 border-indigo-500 shadow-md shadow-indigo-500/5'
                        : 'bg-slate-800/40 border-2 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-100">{addon.name}</div>
                      <div className="text-[11px] font-semibold text-emerald-500 mt-0.5">
                        {currencySymbol}{estMonthly}/mo est.
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        active ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 bg-slate-900/50'
                      }`}
                    >
                      {active && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-900/60 hover:bg-slate-700 border border-slate-700/50 transition-all duration-200 active:scale-[0.98]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Foundations</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20 transition-all duration-200 active:scale-[0.98]"
            >
              <span>Continue to Team & Rates (Step 3)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Squad Composition & Regional Rate Benchmark */}
      {currentStep === 3 && (
        <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <Globe2 className="w-5 h-5 text-indigo-400" />
              <span>Dedicated Engineering Squad & Regional Rate Benchmarks</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              ScopeCraft models senior dedicated technical squads across global rate benchmarks.
            </p>
          </div>

          {/* Dedicated Squad Regional Benchmark Matrix */}
          <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-700/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">
                  Regional Rate Comparison
                </span>
                <h3 className="text-base font-bold text-slate-100">
                  Select Location Rate Benchmark
                </h3>
              </div>
              <div className="text-xs font-semibold px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 self-start sm:self-auto">
                Dedicated Offshore Benchmark: ~70% Cost Advantage
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
              {REGIONS.map((r) => {
                const isSelected = state.regionId === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => updateState({ regionId: r.id })}
                    className={`p-3.5 rounded-xl text-left transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800/80 border-2 border-indigo-500 shadow-md shadow-indigo-500/5'
                        : 'bg-slate-800/40 border-2 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">{r.flag}</span>
                      <span className="text-xs font-bold text-emerald-500">
                        {(r.rateMultiplier * 100).toFixed(0)}% Index
                      </span>
                    </div>
                    <div className="font-bold text-xs text-slate-100 mt-1.5">{r.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{r.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Team Squad Headcount Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Recommended Engineering Squad Roles</span>
              </h3>
              <span className="text-xs font-semibold text-emerald-500">
                Total Team: {state.team.reduce((acc, t) => acc + t.count, 0)} Specialists
              </span>
            </div>

            <div className="border border-slate-700/50 rounded-xl divide-y divide-slate-800 overflow-hidden bg-slate-900/40">
              {TEAM_ROLES.map((role) => {
                const teamMember = state.team.find((m) => m.roleId === role.id);
                const count = teamMember ? teamMember.count : 0;
                const regionalRate = Math.round(role.defaultHourlyRate * activeRegion.rateMultiplier * exchangeRate);
                return (
                  <div key={role.id} className="p-3.5 flex items-center justify-between hover:bg-slate-800/60 transition-all duration-200">
                    <div className="pr-4">
                      <div className="text-xs font-bold text-slate-100">{role.title}</div>
                      <div className="text-[11px] text-slate-400">{role.description}</div>
                    </div>
                    <div className="flex items-center space-x-3 flex-shrink-0">
                      <span className="text-xs font-semibold text-emerald-500">
                        {currencySymbol}{regionalRate}/hr
                      </span>
                      <div className="flex items-center space-x-1.5 bg-slate-800 border border-slate-700/50 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateRoleCount(role.id, -1)}
                          disabled={count === 0}
                          className="p-1 rounded text-slate-300 hover:bg-slate-700 disabled:opacity-30 transition-all duration-200 active:scale-[0.98]"
                          title="Decrease headcount"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-slate-100">
                          {count}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateRoleCount(role.id, 1)}
                          className="p-1 rounded text-slate-300 hover:bg-slate-700 transition-all duration-200 active:scale-[0.98]"
                          title="Increase headcount"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-900/60 hover:bg-slate-700 border border-slate-700/50 transition-all duration-200 active:scale-[0.98]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Modules</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20 transition-all duration-200 active:scale-[0.98]"
            >
              <span>Continue to Unlock Estimate (Step 4)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Complimentary Lead Form & Calculation Reveal */}
      {currentStep === 4 && (
        <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-6 sm:p-10 shadow-xl space-y-8">
          {/* Trust Guarantee Card */}
          <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-700/50 space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-lg text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>100% Complimentary · Instant Calculation Unlock</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
              Your Customized Project Estimate is Ready
            </h2>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Submitting your details unlocks the interactive estimation suite, including full dev hour itemizations, monthly team burn schedules, Gantt phase planning, and PDF statement of work export.
            </p>

            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/50 text-xs text-slate-300 space-y-1">
              <div className="font-bold text-slate-100 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>ScopeCraft Consultative Transparency:</span>
              </div>
              <p className="text-slate-400">
                We capture your business details to save your scoping records and connect you with our solutions engineering team. If you would like your technical specifications formally vetted by a Principal Solutions Architect with a comprehensive delivery roadmap, that paid advisory service is available—completely optional.
              </p>
            </div>
          </div>

          {/* Form Grid */}
          <form onSubmit={handleSubmitLeadAndReveal} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={leadForm.fullName}
                    onChange={(e) => setLeadForm({ ...leadForm, fullName: e.target.value })}
                    placeholder="e.g. Jordan Lee"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-slate-100 bg-slate-900/70 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-all duration-200 ${
                      formErrors.fullName ? 'border-red-500' : 'border-slate-700/50'
                    }`}
                  />
                </div>
                {formErrors.fullName && <p className="text-[11px] text-red-400 mt-1">{formErrors.fullName}</p>}
              </div>

              {/* Work Email */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Business Work Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    placeholder="e.g. jordan@company.com"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-slate-100 bg-slate-900/70 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-all duration-200 ${
                      formErrors.email ? 'border-red-500' : 'border-slate-700/50'
                    }`}
                  />
                </div>
                {formErrors.email && <p className="text-[11px] text-red-400 mt-1">{formErrors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                    placeholder="e.g. +1 (555) 019-2834"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-slate-100 bg-slate-900/70 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-all duration-200 ${
                      formErrors.phone ? 'border-red-500' : 'border-slate-700/50'
                    }`}
                  />
                </div>
                {formErrors.phone && <p className="text-[11px] text-red-400 mt-1">{formErrors.phone}</p>}
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Company / Organization *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={leadForm.company}
                    onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
                    placeholder="e.g. Acme Innovations Corp"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-slate-100 bg-slate-900/70 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-all duration-200 ${
                      formErrors.company ? 'border-red-500' : 'border-slate-700/50'
                    }`}
                  />
                </div>
                {formErrors.company && <p className="text-[11px] text-red-400 mt-1">{formErrors.company}</p>}
              </div>

              {/* Role / Job Title */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Your Primary Role
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <select
                    value={leadForm.role}
                    onChange={(e) => setLeadForm({ ...leadForm, role: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700/50 text-sm text-slate-100 bg-slate-900/70 focus:outline-none focus:border-indigo-500 transition-all duration-200"
                  >
                    <option value="Founder / C-Level Executive" className="bg-slate-900">Founder / C-Level Executive</option>
                    <option value="VP of Product / Head of Product" className="bg-slate-900">VP of Product / Head of Product</option>
                    <option value="VP of Engineering / CTO" className="bg-slate-900">VP of Engineering / CTO</option>
                    <option value="Technical Project Manager" className="bg-slate-900">Technical Project Manager</option>
                    <option value="Operations / Enterprise Procurement" className="bg-slate-900">Operations / Enterprise Procurement</option>
                    <option value="Other Stakeholder" className="bg-slate-900">Other Stakeholder</option>
                  </select>
                </div>
              </div>

              {/* Planned Budget Range */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Planned Budget Range
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <select
                    value={leadForm.budgetRange}
                    onChange={(e) => setLeadForm({ ...leadForm, budgetRange: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700/50 text-sm text-slate-100 bg-slate-900/70 focus:outline-none focus:border-indigo-500 transition-all duration-200"
                  >
                    <option value="Under $25k" className="bg-slate-900">Under $25,000</option>
                    <option value="$25k - $50k" className="bg-slate-900">$25,000 - $50,000</option>
                    <option value="$50k - $100k" className="bg-slate-900">$50,000 - $100,000</option>
                    <option value="$100k - $250k" className="bg-slate-900">$100,000 - $250,000</option>
                    <option value="$250k+" className="bg-slate-900">$250,000+</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Optional Paid Architect Review Matrix Card */}
            <button
              type="button"
              aria-pressed={leadForm.wantsOptionalPaidReview}
              onClick={() => setLeadForm({ ...leadForm, wantsOptionalPaidReview: !leadForm.wantsOptionalPaidReview })}
              className={`w-full p-4 rounded-xl text-left flex items-start space-x-3 transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                leadForm.wantsOptionalPaidReview
                  ? 'bg-slate-800/80 border-2 border-indigo-500 shadow-md shadow-indigo-500/5'
                  : 'bg-slate-800/40 border-2 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div
                className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                  leadForm.wantsOptionalPaidReview ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-600 bg-slate-900/60'
                }`}
              >
                {leadForm.wantsOptionalPaidReview && <Check className="w-3 h-3" />}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-100">
                  Request Senior Solutions Architect Review (Optional)
                </div>
                <p className="text-[11px] text-slate-400 leading-normal mt-0.5">
                  Have an experienced Principal Architect independently vet your technical stack, architecture diagrams, and milestones.
                </p>
              </div>
            </button>

            {/* Mandatory Privacy & Contact Consent */}
            <div className="p-4 rounded-xl border border-slate-700/50 bg-slate-900/50">
              <div className="flex items-start space-x-3">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={leadForm.consentGiven}
                  aria-label="Agree to Privacy Policy"
                  onClick={() => setLeadForm({ ...leadForm, consentGiven: !leadForm.consentGiven })}
                  className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                    leadForm.consentGiven ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-600 bg-slate-800'
                  }`}
                >
                  {leadForm.consentGiven && <Check className="w-3 h-3" />}
                </button>
                <div className="text-xs text-slate-300 leading-normal">
                  <span>I agree to the </span>
                  <button
                    type="button"
                    onClick={() => setIsPrivacyModalOpen(true)}
                    className="text-indigo-400 font-semibold underline hover:text-indigo-300 transition-all duration-200"
                  >
                    Privacy Policy
                  </button>
                  <span> and understand that using this estimation suite is 100% complimentary. I consent to receiving consultative communications regarding this project estimate.</span>
                </div>
              </div>
              {formErrors.consent && <p className="text-[11px] text-red-400 mt-1.5 pl-7">{formErrors.consent}</p>}
            </div>

            {submitError && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
                {submitError}
              </div>
            )}

            {/* Submission Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-700/50">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-900/60 hover:bg-slate-700 border border-slate-700/50 transition-all duration-200 active:scale-[0.98] order-2 sm:order-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Team & Rates</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 order-1 sm:order-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Calculation...</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Calculate & Unlock Scope Breakdown</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />
    </div>
  );
};
