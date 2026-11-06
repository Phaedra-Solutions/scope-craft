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
  Lock,
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
  Check,
  Info
} from 'lucide-react';

interface GuidedScopingWizardProps {
  initialState: ProjectState;
  onComplete: (lead: LeadProfile, updatedState: ProjectState) => void;
  currencySymbol: string;
  exchangeRate: number;
}

export const GuidedScopingWizard: React.FC<GuidedScopingWizardProps> = ({
  initialState,
  onComplete,
  currencySymbol,
  exchangeRate
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [state, setState] = useState<ProjectState>(initialState);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    setState((prev) => ({ ...prev, ...updates }));
  };

  // Toggle platform selection
  const handleTogglePlatform = (platform: ProjectPlatform) => {
    const current = [...state.platforms];
    const exists = current.includes(platform);
    let updated: ProjectPlatform[];
    if (exists) {
      if (current.length === 1) return; // Keep at least one
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
        localStorage.setItem('phaedra_lead_profile', JSON.stringify(leadProfile));
        localStorage.setItem('phaedra_unlocked_lead', 'true');
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

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6">
      
      {/* Top Wizard Banner & Progress Steps */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>ScopeCraft Precision Scoping</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Software Cost & Team Estimator
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Select your project parameters to calculate development hours, team composition, and transparent budget estimates.
            </p>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
              Step {currentStep} of 4
            </span>
          </div>
        </div>

        {/* 4 Clean Step Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6">
          {[
            { step: 1, label: '1. Foundations', desc: 'Platforms & Scale' },
            { step: 2, label: '2. Modules', desc: 'Core Functionality' },
            { step: 3, label: '3. Team & Rates', desc: 'Headcount & Rates' },
            { step: 4, label: '4. Unlock Estimate', desc: 'Full Calculation' }
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
                className={`text-left p-3 rounded-xl border transition ${
                  isCurrent
                    ? 'border-blue-600 bg-blue-50/60 shadow-xs ring-1 ring-blue-500'
                    : isPassed
                    ? 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 cursor-pointer'
                    : 'border-slate-200 bg-slate-50/60 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <div
                    className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                      isPassed
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-300 text-slate-700'
                    }`}
                  >
                    {isPassed ? <Check className="w-3 h-3" /> : item.step}
                  </div>
                  <span className={`text-xs font-bold ${isCurrent ? 'text-blue-900' : isPassed ? 'text-emerald-900' : 'text-slate-600'}`}>
                    {item.label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 pl-7 leading-tight">{item.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 1: Foundations & Platforms */}
      {currentStep === 1 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-8 animate-fade-in">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <span>Project Foundations & Deployment Platforms</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Specify your project identification and target client platforms.
            </p>
          </div>

          {/* Project & Client Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Project Title
              </label>
              <input
                type="text"
                value={state.projectName}
                onChange={(e) => updateState({ projectName: e.target.value })}
                placeholder="e.g. Enterprise SaaS Platform"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Company / Organization
              </label>
              <input
                type="text"
                value={state.clientName}
                onChange={(e) => updateState({ clientName: e.target.value })}
                placeholder="e.g. Acme Corporation"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-2xs"
              />
            </div>
          </div>

          {/* Target Platforms Cards */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2.5">
              Select Target Platforms (Multi-Select)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { id: 'web' as ProjectPlatform, name: 'Web Application', icon: Laptop, desc: 'Responsive Web / Cloud' },
                { id: 'ios' as ProjectPlatform, name: 'iOS Native', icon: Smartphone, desc: 'Swift & SwiftUI' },
                { id: 'android' as ProjectPlatform, name: 'Android Native', icon: Smartphone, desc: 'Kotlin & Jetpack' },
                { id: 'cross_platform' as ProjectPlatform, name: 'Cross-Platform', icon: Code2, desc: 'React Native / Flutter' },
                { id: 'desktop' as ProjectPlatform, name: 'Desktop Suite', icon: Laptop, desc: 'Electron / Tauri' }
              ].map((p) => {
                const active = state.platforms.includes(p.id);
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleTogglePlatform(p.id)}
                    className={`p-4 rounded-xl border text-left transition flex flex-col justify-between space-y-3 ${
                      active
                        ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${active ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                        {active && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-tight">{p.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Complexity Tier & Design Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Architecture Complexity
              </label>
              <div className="space-y-2">
                {[
                  { id: 'mvp' as ComplexityLevel, title: 'MVP / Fast Prototype', desc: 'Core feature validation, rapid market launch.' },
                  { id: 'standard' as ComplexityLevel, title: 'Production Standard', desc: 'Full multi-tenant architecture, robust API suite.' },
                  { id: 'enterprise' as ComplexityLevel, title: 'Enterprise Scaled', desc: 'High concurrency, compliance, automated QA pipelines.' }
                ].map((tier) => (
                  <label
                    key={tier.id}
                    className={`flex items-start p-3 rounded-xl border cursor-pointer transition ${
                      state.complexity === tier.id
                        ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-500 shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="complexity"
                      checked={state.complexity === tier.id}
                      onChange={() => updateState({ complexity: tier.id })}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <div className="text-xs font-bold text-slate-900">{tier.title}</div>
                      <div className="text-[11px] text-slate-500 leading-tight">{tier.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Design & UI/UX Fidelity
              </label>
              <div className="space-y-2">
                {[
                  { id: 'wireframe' as DesignLevel, title: 'Wireframes / System UI', desc: 'Functional component library, clean system patterns.' },
                  { id: 'standard_ui' as DesignLevel, title: 'Polished Brand UI', desc: 'Custom iconography, responsive components & brand styling.' },
                  { id: 'custom_bespoke' as DesignLevel, title: 'Bespoke Luxury Experience', desc: 'Custom micro-interactions, motion design & Figma library.' }
                ].map((tier) => (
                  <label
                    key={tier.id}
                    className={`flex items-start p-3 rounded-xl border cursor-pointer transition ${
                      state.designLevel === tier.id
                        ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-500 shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="designLevel"
                      checked={state.designLevel === tier.id}
                      onChange={() => updateState({ designLevel: tier.id })}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <div className="text-xs font-bold text-slate-900">{tier.title}</div>
                      <div className="text-[11px] text-slate-500 leading-tight">{tier.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Step 1 Actions */}
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition"
            >
              <span>Continue to Modules (Step 2)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Feature Modules Catalog */}
      {currentStep === 2 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <Code2 className="w-5 h-5 text-blue-600" />
                <span>Select Feature Modules & Add-ons</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Choose the technical features required for your platform.
              </p>
            </div>
            <div className="px-3 py-1 rounded-lg bg-blue-50 text-blue-800 font-semibold text-xs border border-blue-200 self-start sm:self-auto">
              {state.selectedFeatureIds.length} Modules Selected
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredFeatures.map((feat) => {
              const active = state.selectedFeatureIds.includes(feat.id);
              return (
                <div
                  key={feat.id}
                  onClick={() => handleToggleFeature(feat.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between space-y-2.5 ${
                    active
                      ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-500 shadow-2xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs text-slate-900 leading-snug">
                      {feat.name}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 whitespace-nowrap">
                      +{feat.baseHours} hrs
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                    {feat.description}
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                    <span className="capitalize text-slate-400">{feat.category.replace('_', ' ')}</span>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${active ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}>
                      {active && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cloud & Managed Infrastructure Services */}
          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Optional Cloud Services & Infrastructure Subscriptions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {SAAS_ADDONS.map((addon) => {
                const active = state.selectedSaaSAddons.includes(addon.id);
                return (
                  <button
                    key={addon.id}
                    type="button"
                    onClick={() => handleToggleSaaS(addon.id)}
                    className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                      active
                        ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{addon.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">${addon.monthlyEstimate}/mo est.</div>
                    </div>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${active ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}>
                      {active && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Foundations</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition"
            >
              <span>Continue to Team & Rates (Step 3)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Squad Composition & Regional Rate Benchmark */}
      {currentStep === 3 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <Globe2 className="w-5 h-5 text-blue-600" />
              <span>Dedicated Engineering Squad & Regional Rate Benchmarks</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              ScopeCraft models senior dedicated technical squads across global rate benchmarks.
            </p>
          </div>

          {/* Dedicated Squad Regional Benchmark Card */}
          <div className="p-5 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block">
                  Regional Rate Comparison
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Select Location Rate Benchmark
                </h3>
              </div>
              <div className="text-xs font-semibold px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
                Dedicated Offshore Benchmark: ~70% Cost Advantage
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
              {REGIONS.map((r) => {
                const isSelected = state.regionId === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => updateState({ regionId: r.id })}
                    className={`p-3 rounded-xl border text-left transition ${
                      isSelected
                        ? 'border-blue-600 bg-white ring-2 ring-blue-500 shadow-xs'
                        : 'border-slate-200 bg-white/70 hover:bg-white'
                    }`}
                  >
                    <div className="text-lg">{r.flag}</div>
                    <div className="font-bold text-xs text-slate-900 mt-1">{r.name}</div>
                    <div className="text-[11px] font-semibold text-blue-600">
                      {(r.rateMultiplier * 100).toFixed(0)}% Rate Index
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Team Squad Headcount Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Recommended Engineering Squad Roles</span>
              </h3>
              <span className="text-xs text-slate-500">
                Total Team: {state.team.reduce((acc, t) => acc + t.count, 0)} Specialists
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden bg-white">
              {TEAM_ROLES.map((role) => {
                const teamMember = state.team.find((m) => m.roleId === role.id);
                const count = teamMember ? teamMember.count : 0;
                return (
                  <div key={role.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition">
                    <div className="pr-4">
                      <div className="text-xs font-bold text-slate-900">{role.title}</div>
                      <div className="text-[11px] text-slate-500">{role.description}</div>
                    </div>
                    <div className="flex items-center space-x-3 flex-shrink-0">
                      <span className="text-xs font-semibold text-slate-600">
                        ${Math.round(role.defaultHourlyRate * 0.3)}/hr
                      </span>
                      <div className="flex items-center space-x-1.5 bg-slate-100 border border-slate-200 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateRoleCount(role.id, -1)}
                          disabled={count === 0}
                          className="p-1 rounded text-slate-600 hover:bg-white disabled:opacity-30 transition"
                          title="Decrease headcount"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-slate-900">
                          {count}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateRoleCount(role.id, 1)}
                          className="p-1 rounded text-slate-600 hover:bg-white transition"
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
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Modules</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition"
            >
              <span>Continue to Unlock Estimate (Step 4)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Complimentary Lead Form & Calculation Reveal */}
      {currentStep === 4 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-xs space-y-8 animate-fade-in">
          
          {/* Trust Guarantee Card */}
          <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Complimentary · Instant Calculation Unlock</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Your Customized Project Estimate is Ready
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Submitting your details unlocks the interactive estimation suite, including full dev hour itemizations, monthly team burn schedules, and PDF statement of work export.
            </p>

            <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>ScopeCraft Consultative Transparency:</span>
              </div>
              <p>
                We capture your business details to save your scoping records and connect you with our solutions engineering team. If you would like your technical specifications formally vetted by a Principal Solutions Architect with a comprehensive delivery roadmap, that paid advisory service is available—completely optional.
              </p>
            </div>
          </div>

          {/* Form Grid */}
          <form onSubmit={handleSubmitLeadAndReveal} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={leadForm.fullName}
                    onChange={(e) => setLeadForm({ ...leadForm, fullName: e.target.value })}
                    placeholder="e.g. Jordan Lee"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-2xs ${
                      formErrors.fullName ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                </div>
                {formErrors.fullName && <p className="text-[11px] text-red-500 mt-1">{formErrors.fullName}</p>}
              </div>

              {/* Work Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Business Work Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    placeholder="e.g. jordan@company.com"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-2xs ${
                      formErrors.email ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                </div>
                {formErrors.email && <p className="text-[11px] text-red-500 mt-1">{formErrors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                    placeholder="e.g. +1 (555) 019-2834"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-2xs ${
                      formErrors.phone ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                </div>
                {formErrors.phone && <p className="text-[11px] text-red-500 mt-1">{formErrors.phone}</p>}
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Company / Organization *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={leadForm.company}
                    onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
                    placeholder="e.g. Acme Innovations Corp"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-2xs ${
                      formErrors.company ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                </div>
                {formErrors.company && <p className="text-[11px] text-red-500 mt-1">{formErrors.company}</p>}
              </div>

              {/* Role / Job Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Your Primary Role
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <select
                    value={leadForm.role}
                    onChange={(e) => setLeadForm({ ...leadForm, role: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-2xs"
                  >
                    <option value="Founder / C-Level Executive">Founder / C-Level Executive</option>
                    <option value="VP of Product / Head of Product">VP of Product / Head of Product</option>
                    <option value="VP of Engineering / CTO">VP of Engineering / CTO</option>
                    <option value="Technical Project Manager">Technical Project Manager</option>
                    <option value="Operations / Enterprise Procurement">Operations / Enterprise Procurement</option>
                    <option value="Other Stakeholder">Other Stakeholder</option>
                  </select>
                </div>
              </div>

              {/* Planned Budget Range */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Planned Budget Range
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <select
                    value={leadForm.budgetRange}
                    onChange={(e) => setLeadForm({ ...leadForm, budgetRange: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-2xs"
                  >
                    <option value="Under $25k">Under $25,000</option>
                    <option value="$25k - $50k">$25,000 - $50,000</option>
                    <option value="$50k - $100k">$50,000 - $100,000</option>
                    <option value="$100k - $250k">$100,000 - $250,000</option>
                    <option value="$250k+">$250,000+</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Optional Paid Architect Review Checkbox */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={leadForm.wantsOptionalPaidReview}
                  onChange={(e) => setLeadForm({ ...leadForm, wantsOptionalPaidReview: e.target.checked })}
                  className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Request Senior Solutions Architect Review (Optional)
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                    Have an experienced Principal Architect independently vet your technical stack, architecture diagrams, and milestones.
                  </p>
                </div>
              </label>
            </div>

            {/* Mandatory Privacy & Contact Consent Checkbox */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={leadForm.consentGiven}
                  onChange={(e) => setLeadForm({ ...leadForm, consentGiven: e.target.checked })}
                  className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <div className="text-xs text-slate-600 leading-normal">
                  <span>I agree to the </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsPrivacyModalOpen(true);
                    }}
                    className="text-blue-600 font-semibold underline hover:text-blue-700"
                  >
                    Privacy Policy
                  </button>
                  <span> and understand that using this estimation suite is 100% complimentary. I consent to receiving consultative communications regarding this project estimate.</span>
                </div>
              </label>
              {formErrors.consent && <p className="text-[11px] text-red-500 mt-1 pl-7">{formErrors.consent}</p>}
            </div>

            {submitError && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                {submitError}
              </div>
            )}

            {/* Submission Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition order-2 sm:order-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Team & Rates</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition disabled:opacity-60 order-1 sm:order-2"
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
