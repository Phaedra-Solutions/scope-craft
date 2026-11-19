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
import { CountryCode } from 'libphonenumber-js/max';
import { PrivacyPolicyModal } from '@/components/PrivacyPolicyModal';
import { PhoneInputField } from '@/components/PhoneInputField';
import { validateAndFormatE164 } from '@/lib/phone-utils';
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
  Briefcase,
  DollarSign,
  Plus,
  Minus,
  Check,
  BookmarkPlus,
  Compass,
  FileText,
  Rocket,
  ExternalLink
} from 'lucide-react';

interface GuidedScopingWizardProps {
  initialState: ProjectState;
  onComplete: (lead: LeadProfile, updatedState: ProjectState) => void;
  onStateChange?: (updated: Partial<ProjectState>) => void;
  onOpenPresetModal?: () => void;
  currencySymbol: string;
  exchangeRate: number;
}

export const GuidedScopingWizard: React.FC<GuidedScopingWizardProps> = ({
  initialState,
  onComplete,
  onStateChange,
  onOpenPresetModal,
  currencySymbol,
  exchangeRate
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
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
    phoneCountry: CountryCode;
    phone: string;
    company: string;
    role: string;
    budgetRange: string;
    wantsOptionalPaidReview: boolean;
    consentGiven: boolean;
  }>({
    fullName: '',
    email: '',
    phoneCountry: 'US',
    phone: '',
    company: '',
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

    const phoneValidation = validateAndFormatE164(leadForm.phone, leadForm.phoneCountry);
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.errorMessage || 'Please enter a valid international E.164 phone number';
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

    const phoneValidation = validateAndFormatE164(leadForm.phone, leadForm.phoneCountry);
    if (!phoneValidation.isValid || !phoneValidation.e164) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const leadProfile: LeadProfile = {
      fullName: leadForm.fullName.trim(),
      email: leadForm.email.trim().toLowerCase(),
      phone: phoneValidation.e164,
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
      <div className="bg-white border border-[#DDE3E7] rounded-2xl p-6 sm:p-8 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#DDE3E7]">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold px-2.5 py-1 rounded-md bg-[#CDFF8C] text-[#082A1C] mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-[#082A1C]" />
              <span>ScopeCraft Precision Scoping</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#082A1C] lb-heading">
              Software Cost & Team Estimator
            </h1>
            <p className="text-sm text-[#64707A] mt-1">
              Configure your architecture, modules, and engineering squad to compute transparent project costs.
            </p>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <span className="text-xs font-mono font-semibold px-3 py-1.5 rounded-lg bg-[#F4F7F9] text-[#082A1C] border border-[#DDE3E7] tabular-nums">
              Step {currentStep} of 5
            </span>
          </div>
        </div>

        {/* Rule 1: Multi-Step Navigation (Flat Minimalism) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 pt-6">
          {[
            { step: 1, label: '01. Overview', desc: 'How ScopeCraft Helps' },
            { step: 2, label: '02. Foundations', desc: 'Platforms & Scale' },
            { step: 3, label: '03. Modules', desc: 'Core Functionality' },
            { step: 4, label: '04. Team & Rates', desc: 'Squad & Benchmarks' },
            { step: 5, label: '05. Unlock SOW', desc: 'Full Calculation' }
          ].map((item) => {
            const isPassed = currentStep > item.step;
            const isCurrent = currentStep === item.step;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => {
                  if (item.step < currentStep || isPassed) {
                    setCurrentStep(item.step as 1 | 2 | 3 | 4 | 5);
                  }
                }}
                disabled={item.step > currentStep}
                className={`text-left pb-3 pt-1 border-b-2 transition-all duration-200 ${
                  isCurrent
                    ? 'border-[#082A1C] text-[#082A1C]'
                    : isPassed
                    ? 'border-[#144731] text-[#082A1C] hover:text-[#144731] cursor-pointer active:scale-[0.98]'
                    : 'border-[#DDE3E7] text-[#64707A] cursor-not-allowed opacity-70'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-bold tracking-tight ${
                      isCurrent || isPassed ? 'text-[#082A1C]' : 'text-[#64707A]'
                    }`}
                  >
                    {item.label}
                  </span>
                  {isPassed && (
                    <span className="w-4 h-4 rounded-full bg-[#CDFF8C] text-[#082A1C] flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className={`text-[11px] leading-tight ${isCurrent ? 'text-[#082A1C]/80' : 'text-[#64707A]'}`}>
                  {item.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 1: Overview & Value Proposition */}
      {currentStep === 1 && (
        <div className="bg-white border border-[#DDE3E7] rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
          {/* Encouraging Hero Card */}
          <div className="p-6 sm:p-7 rounded-xl bg-[#082A1C] text-white space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-lg text-xs font-bold text-[#082A1C] bg-[#CDFF8C]">
              <Compass className="w-3.5 h-3.5 text-[#082A1C]" />
              <span>Welcome to ScopeCraft · 3-Minute Interactive Scoping</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white lb-heading">
              Scope Smarter, Budget with Confidence, and Launch Faster
            </h2>
            <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed max-w-3xl">
              Turn your software idea into an actionable engineering blueprint before writing a single line of code.
              Walk through four quick configuration steps to benchmark effort hours, align your ideal team structure,
              compare global rate options, and unlock a complete Statement of Work (SOW)—100% complimentary.
            </p>
          </div>

          {/* Customer Pain Points Resolved */}
          <div>
            <div className="mb-4">
              <h3 className="text-base font-bold text-[#082A1C] lb-heading">
                Key Challenges ScopeCraft Solves for Your Team
              </h3>
              <p className="text-xs text-[#64707A] mt-0.5">
                Built for founders, product leaders, and procurement teams tired of guesswork and opaque estimates.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: DollarSign,
                  title: 'Eliminate Unpredictable Vendor Quotes',
                  desc: 'Stop navigating vague agency proposals. Benchmark transparent dev hours, contingency buffers, and regional pricing before signing contracts.'
                },
                {
                  icon: Users,
                  title: 'Right-Size Squads & Launch Timelines',
                  desc: 'Prevent understaffing bottlenecks or inflated retainers by aligning specialist headcount and sprint velocity with your target delivery window.'
                },
                {
                  icon: Layers,
                  title: 'Surface Hidden Technical & Cloud Scope',
                  desc: 'Account upfront for auth, billing, AI workflows, QA rigor, maintenance retainers, and recurring cloud SaaS infrastructure.'
                },
                {
                  icon: FileText,
                  title: 'Accelerate Executive & Stakeholder Sign-Off',
                  desc: 'Skip weeks of manual spreadsheets. Unlock monthly burn schedules, Gantt phase breakdowns, and boardroom-ready PDF/HTML SOW exports.'
                }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="p-4 rounded-xl bg-[#F4F7F9] border border-[#DDE3E7] flex items-start space-x-3.5"
                  >
                    <div className="p-2.5 rounded-lg bg-white border border-[#DDE3E7] text-[#082A1C] flex-shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#082A1C]">{item.title}</h4>
                      <p className="text-xs text-[#64707A] leading-relaxed mt-1">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optional Architect Upgrade + Phaedra Solutions Build Support */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl bg-[#F4F7F9] border border-[#DDE3E7] space-y-2.5">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-[#CDFF8C] text-[#082A1C]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#082A1C]">
                  Optional Upgrade: Vetted Solutions Architect Plan
                </h3>
              </div>
              <p className="text-xs text-[#64707A] leading-relaxed">
                Calculating and exporting your scope is completely free. Need formal technical due diligence for
                investors or enterprise stakeholders? You can optionally request a paid review from a{' '}
                <strong className="text-[#082A1C]">Principal Solutions Architect</strong> to audit your technical
                stack, refine risk buffers, and deliver a comprehensive milestone-by-milestone project plan.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#F4F7F9] border border-[#DDE3E7] space-y-2.5 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-[#082A1C] text-[#CDFF8C]">
                    <Rocket className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-[#082A1C]">
                    Ready to Build? ScopeCraft by Phaedra Solutions Can Help
                  </h3>
                </div>
                <p className="text-xs text-[#64707A] leading-relaxed">
                  Once your roadmap is locked,{' '}
                  <strong className="text-[#082A1C]">ScopeCraft by Phaedra Solutions</strong> can assemble a dedicated
                  senior engineering squad matched to your exact estimate—taking your product seamlessly from technical
                  scoping to full-scale development and launch.
                </p>
              </div>
              <div className="pt-1">
                <a
                  href="https://www.phaedrasolutions.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#082A1C] hover:underline underline-offset-4"
                >
                  <span>Explore delivery services at Phaedra Solutions</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Step 1 Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-[#DDE3E7]">
            {onOpenPresetModal ? (
              <button
                type="button"
                onClick={onOpenPresetModal}
                className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-[#082A1C] bg-[#F4F7F9] hover:bg-[#DDE3E7]/60 border border-[#DDE3E7] transition-all duration-200 active:scale-[0.98]"
              >
                <BookmarkPlus className="w-4 h-4 text-[#082A1C]" />
                <span>Browse Industry Presets</span>
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl text-sm font-bold lb-btn-primary shadow-sm active:scale-[0.98]"
            >
              <span>Start Scoping Foundations (Step 2)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Foundations & Platforms */}
      {currentStep === 2 && (
        <div className="bg-white border border-[#DDE3E7] rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
          <div>
            <h2 className="text-xl font-bold text-[#082A1C] lb-heading flex items-center space-x-2">
              <Layers className="w-5 h-5 text-[#082A1C]" />
              <span>Project Foundations & Deployment Platforms</span>
            </h2>
            <p className="text-xs text-[#64707A] mt-1">
              Specify your project identification, target platforms, architecture scale, and design fidelity.
            </p>
          </div>

          {/* Project Title & Quick Presets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#082A1C] mb-1.5">
                Project Title
              </label>
              <input
                type="text"
                value={state.projectName}
                onChange={(e) => updateState({ projectName: e.target.value })}
                placeholder="e.g. Enterprise SaaS Platform"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE3E7] bg-[#F4F7F9] focus:bg-white text-[#082A1C] placeholder:text-[#64707A]/60 text-sm focus:outline-none focus:border-[#082A1C] transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#082A1C] mb-1.5">
                Industry Scope Presets
              </label>
              <button
                type="button"
                onClick={onOpenPresetModal}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE3E7] bg-[#F4F7F9] hover:bg-white hover:border-[#082A1C] text-[#082A1C] text-sm font-medium flex items-center justify-between gap-2 transition-all duration-200 active:scale-[0.98] cursor-pointer text-left"
                title="Load industry presets"
              >
                <span className="flex items-center space-x-2 truncate">
                  <BookmarkPlus className="w-4 h-4 text-[#082A1C] flex-shrink-0" />
                  <span className="truncate">Load Industry Preset</span>
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#CDFF8C] text-[#082A1C] flex-shrink-0">
                  Presets
                </span>
              </button>
            </div>
          </div>

          {/* Target Platforms Matrix Cards */}
          <div>
            <label className="block text-xs font-semibold text-[#082A1C] mb-3">
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
                        ? 'bg-white border-2 border-[#082A1C] shadow-md shadow-[#082A1C]/5'
                        : 'bg-[#F4F7F9] border-2 border-[#DDE3E7] hover:border-[#64707A]/60'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      <div
                        className={`p-2.5 rounded-lg border ${
                          active
                            ? 'bg-[#082A1C] border-[#082A1C] text-[#CDFF8C]'
                            : 'bg-white border-[#DDE3E7] text-[#64707A]'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-[#082A1C]">{p.name}</div>
                        <div className="text-xs text-[#64707A] mt-0.5 leading-tight">{p.desc}</div>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                        active ? 'bg-[#CDFF8C] border-[#082A1C] text-[#082A1C]' : 'border-[#DDE3E7] bg-white'
                      }`}
                    >
                      {active && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Architecture Complexity Matrix Cards */}
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-[#082A1C] mb-3">
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
                          ? 'bg-white border-2 border-[#082A1C] shadow-md shadow-[#082A1C]/5'
                          : 'bg-[#F4F7F9] border-2 border-[#DDE3E7] hover:border-[#64707A]/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-[#082A1C]">{tier.title}</span>
                          <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#CDFF8C] text-[#082A1C] tabular-nums">
                            {tier.mult}
                          </span>
                        </div>
                        <div className="text-xs text-[#64707A] leading-relaxed mt-1">{tier.desc}</div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          active ? 'border-[#082A1C] bg-[#CDFF8C]' : 'border-[#DDE3E7] bg-white'
                        }`}
                      >
                        {active && <div className="w-2 h-2 rounded-full bg-[#082A1C]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Design & UI/UX Fidelity Matrix Cards */}
            <div>
              <label className="block text-xs font-semibold text-[#082A1C] mb-3">
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
                          ? 'bg-white border-2 border-[#082A1C] shadow-md shadow-[#082A1C]/5'
                          : 'bg-[#F4F7F9] border-2 border-[#DDE3E7] hover:border-[#64707A]/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-[#082A1C]">{tier.title}</span>
                          <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#CDFF8C] text-[#082A1C] tabular-nums">
                            {tier.mult}
                          </span>
                        </div>
                        <div className="text-xs text-[#64707A] leading-relaxed mt-1">{tier.desc}</div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          active ? 'border-[#082A1C] bg-[#CDFF8C]' : 'border-[#DDE3E7] bg-white'
                        }`}
                      >
                        {active && <div className="w-2 h-2 rounded-full bg-[#082A1C]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Step 2 Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[#DDE3E7]">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-[#082A1C] bg-[#F4F7F9] hover:bg-[#DDE3E7]/60 border border-[#DDE3E7] transition-all duration-200 active:scale-[0.98]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Overview</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-bold lb-btn-primary shadow-sm active:scale-[0.98]"
            >
              <span>Continue to Modules (Step 3)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Feature Modules Catalog */}
      {currentStep === 3 && (
        <div className="bg-white border border-[#DDE3E7] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-[#082A1C] lb-heading flex items-center space-x-2">
                <Code2 className="w-5 h-5 text-[#082A1C]" />
                <span>Select Feature Modules & Add-ons</span>
              </h2>
              <p className="text-xs text-[#64707A] mt-1">
                Choose the technical features required for your platform.
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-[#CDFF8C] text-[#082A1C] font-semibold text-xs border border-[#082A1C]/15 self-start sm:self-auto tabular-nums">
              <span className="font-mono font-bold">{state.selectedFeatureIds.length}</span> Modules Selected
            </div>
          </div>

          {/* Category Filter Tabs (Flat Minimalism) */}
          <div className="flex items-center gap-4 overflow-x-auto pb-1 border-b border-[#DDE3E7] no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`pb-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all duration-200 active:scale-[0.98] ${
                  activeCategory === cat.id
                    ? 'border-[#082A1C] text-[#082A1C]'
                    : 'border-transparent text-[#64707A] hover:text-[#082A1C]'
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
                      ? 'bg-white border-2 border-[#082A1C] shadow-md shadow-[#082A1C]/5'
                      : 'bg-[#F4F7F9] border-2 border-[#DDE3E7] hover:border-[#64707A]/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 w-full">
                    <span className="font-bold text-xs text-[#082A1C] leading-snug">
                      {feat.name}
                    </span>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#CDFF8C] text-[#082A1C] whitespace-nowrap tabular-nums">
                      +{feat.baseHours} hrs
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64707A] leading-relaxed line-clamp-2">
                    {feat.description}
                  </p>
                  <div className="flex items-center justify-between w-full pt-2 border-t border-[#DDE3E7] text-[11px]">
                    <span className="capitalize text-[#64707A]">{feat.category.replace('_', ' ')}</span>
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-200 ${
                        active ? 'bg-[#082A1C] border-[#082A1C] text-[#CDFF8C]' : 'border-[#DDE3E7] bg-white'
                      }`}
                    >
                      {active && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Cloud & Managed Infrastructure Services */}
          <div className="pt-4 border-t border-[#DDE3E7]">
            <h3 className="text-xs font-bold text-[#082A1C] uppercase tracking-wider mb-3">
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
                        ? 'bg-white border-2 border-[#082A1C] shadow-md shadow-[#082A1C]/5'
                        : 'bg-[#F4F7F9] border-2 border-[#DDE3E7] hover:border-[#64707A]/60'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-[#082A1C]">{addon.name}</div>
                      <div className="text-[11px] font-mono font-semibold text-[#144731] mt-0.5 tabular-nums">
                        {currencySymbol}{estMonthly}/mo est.
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        active ? 'bg-[#082A1C] border-[#082A1C] text-[#CDFF8C]' : 'border-[#DDE3E7] bg-white'
                      }`}
                    >
                      {active && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[#DDE3E7]">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-[#082A1C] bg-[#F4F7F9] hover:bg-[#DDE3E7]/60 border border-[#DDE3E7] transition-all duration-200 active:scale-[0.98]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Foundations</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-bold lb-btn-primary shadow-sm active:scale-[0.98]"
            >
              <span>Continue to Team & Rates (Step 4)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Squad Composition & Regional Rate Benchmark */}
      {currentStep === 4 && (
        <div className="bg-white border border-[#DDE3E7] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[#082A1C] lb-heading flex items-center space-x-2">
              <Globe2 className="w-5 h-5 text-[#082A1C]" />
              <span>Dedicated Engineering Squad & Regional Rate Benchmarks</span>
            </h2>
            <p className="text-xs text-[#64707A] mt-1">
              ScopeCraft models senior dedicated technical squads across global rate benchmarks.
            </p>
          </div>

          {/* Dedicated Squad Regional Benchmark Matrix */}
          <div className="p-5 rounded-xl bg-[#F4F7F9] border border-[#DDE3E7] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-mono font-bold text-[#64707A] uppercase tracking-wider block">
                  Regional Rate Comparison
                </span>
                <h3 className="text-base font-bold text-[#082A1C] lb-heading">
                  Select Location Rate Benchmark
                </h3>
              </div>
              <div className="text-xs font-bold px-3 py-1 rounded-lg bg-[#CDFF8C] text-[#082A1C] border border-[#082A1C]/15 self-start sm:self-auto">
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
                        ? 'bg-white border-2 border-[#082A1C] shadow-md shadow-[#082A1C]/5'
                        : 'bg-white/60 border-2 border-[#DDE3E7] hover:border-[#64707A]/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">{r.flag}</span>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#CDFF8C] text-[#082A1C] tabular-nums">
                        {(r.rateMultiplier * 100).toFixed(0)}% Index
                      </span>
                    </div>
                    <div className="font-bold text-xs text-[#082A1C] mt-1.5">{r.name}</div>
                    <div className="text-[11px] text-[#64707A] mt-0.5 line-clamp-1">{r.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Team Squad Headcount Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#082A1C] flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#082A1C]" />
                <span>Recommended Engineering Squad Roles</span>
              </h3>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-[#CDFF8C] text-[#082A1C] tabular-nums">
                Total Team: {state.team.reduce((acc, t) => acc + t.count, 0)} Specialists
              </span>
            </div>

            <div className="border border-[#DDE3E7] rounded-xl divide-y divide-[#DDE3E7] overflow-hidden bg-[#F4F7F9]">
              {TEAM_ROLES.map((role) => {
                const teamMember = state.team.find((m) => m.roleId === role.id);
                const count = teamMember ? teamMember.count : 0;
                const regionalRate = Math.round(role.defaultHourlyRate * activeRegion.rateMultiplier * exchangeRate);
                return (
                  <div key={role.id} className="p-3.5 flex items-center justify-between hover:bg-white transition-all duration-200">
                    <div className="pr-4">
                      <div className="text-xs font-bold text-[#082A1C]">{role.title}</div>
                      <div className="text-[11px] text-[#64707A]">{role.description}</div>
                    </div>
                    <div className="flex items-center space-x-3 flex-shrink-0">
                      <span className="text-xs font-mono font-bold text-[#082A1C] tabular-nums">
                        {currencySymbol}{regionalRate}/hr
                      </span>
                      <div className="flex items-center space-x-1.5 bg-white border border-[#DDE3E7] rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateRoleCount(role.id, -1)}
                          disabled={count === 0}
                          className="p-1 rounded text-[#082A1C] hover:bg-[#F4F7F9] disabled:opacity-30 transition-all duration-200 active:scale-[0.98]"
                          title="Decrease headcount"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-mono font-bold text-[#082A1C] tabular-nums">
                          {count}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateRoleCount(role.id, 1)}
                          className="p-1 rounded text-[#082A1C] hover:bg-[#F4F7F9] transition-all duration-200 active:scale-[0.98]"
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
          <div className="flex items-center justify-between pt-4 border-t border-[#DDE3E7]">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-[#082A1C] bg-[#F4F7F9] hover:bg-[#DDE3E7]/60 border border-[#DDE3E7] transition-all duration-200 active:scale-[0.98]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Modules</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(5)}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-bold lb-btn-primary shadow-sm active:scale-[0.98]"
            >
              <span>Continue to Unlock Estimate (Step 5)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Complimentary Lead Form & Calculation Reveal */}
      {currentStep === 5 && (
        <div className="bg-white border border-[#DDE3E7] rounded-2xl p-6 sm:p-10 shadow-sm space-y-8">
          {/* Trust Guarantee Card */}
          <div className="p-6 rounded-xl bg-[#082A1C] text-white space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-lg text-xs font-bold text-[#082A1C] bg-[#CDFF8C]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#082A1C]" />
              <span>100% Complimentary · Instant Calculation Unlock</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white lb-heading">
              Your Customized Project Estimate is Ready
            </h2>

            <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
              Submitting your details unlocks the interactive estimation suite, including full dev hour itemizations, monthly team burn schedules, Gantt phase planning, and PDF statement of work export.
            </p>

            <div className="p-4 rounded-xl bg-[#0F3827] border border-[#1E4F3A] text-xs text-white/90 space-y-1">
              <div className="font-bold text-white flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-[#CDFF8C]" />
                <span>ScopeCraft Consultative Transparency:</span>
              </div>
              <p className="text-[#94A3B8]">
                We capture your business details to save your scoping records and connect you with our solutions engineering team. If you would like your technical specifications formally vetted by a Principal Solutions Architect with a comprehensive delivery roadmap, that paid advisory service is available—completely optional.
              </p>
            </div>
          </div>

          {/* Form Grid */}
          <form onSubmit={handleSubmitLeadAndReveal} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-[#082A1C] mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#64707A] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={leadForm.fullName}
                    onChange={(e) => setLeadForm({ ...leadForm, fullName: e.target.value })}
                    placeholder="e.g. Jordan Lee"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-[#082A1C] bg-[#F4F7F9] focus:bg-white placeholder:text-[#64707A]/60 focus:outline-none focus:border-[#082A1C] transition-all duration-200 ${
                      formErrors.fullName ? 'border-red-600' : 'border-[#DDE3E7]'
                    }`}
                  />
                </div>
                {formErrors.fullName && <p className="text-[11px] text-red-600 mt-1">{formErrors.fullName}</p>}
              </div>

              {/* Work Email */}
              <div>
                <label className="block text-xs font-bold text-[#082A1C] mb-1.5">
                  Business Work Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#64707A] absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    placeholder="e.g. jordan@company.com"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-[#082A1C] bg-[#F4F7F9] focus:bg-white placeholder:text-[#64707A]/60 focus:outline-none focus:border-[#082A1C] transition-all duration-200 ${
                      formErrors.email ? 'border-red-600' : 'border-[#DDE3E7]'
                    }`}
                  />
                </div>
                {formErrors.email && <p className="text-[11px] text-red-600 mt-1">{formErrors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="wizard-lead-phone" className="block text-xs font-bold text-[#082A1C] mb-1.5">
                  Phone Number (International E.164) *
                </label>
                <PhoneInputField
                  id="wizard-lead-phone"
                  required
                  country={leadForm.phoneCountry}
                  onCountryChange={(nextCountry) => {
                    setLeadForm((prev) => {
                      const updated = { ...prev, phoneCountry: nextCountry };
                      if (formErrors.phone && prev.phone.trim()) {
                        const check = validateAndFormatE164(prev.phone, nextCountry);
                        setFormErrors((errs) => ({
                          ...errs,
                          phone: check.isValid ? '' : (check.errorMessage || '')
                        }));
                      }
                      return updated;
                    });
                  }}
                  value={leadForm.phone}
                  onChange={(nextPhone) => {
                    setLeadForm((prev) => ({ ...prev, phone: nextPhone }));
                    if (formErrors.phone) {
                      const check = validateAndFormatE164(nextPhone, leadForm.phoneCountry);
                      setFormErrors((errs) => ({
                        ...errs,
                        phone: check.isValid ? '' : (check.errorMessage || '')
                      }));
                    }
                  }}
                  onBlur={() => {
                    if (leadForm.phone.trim()) {
                      const check = validateAndFormatE164(leadForm.phone, leadForm.phoneCountry);
                      setFormErrors((errs) => ({
                        ...errs,
                        phone: check.isValid ? '' : (check.errorMessage || '')
                      }));
                    }
                  }}
                  error={formErrors.phone}
                />
                {formErrors.phone && <p className="text-[11px] text-red-600 mt-1">{formErrors.phone}</p>}
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-xs font-bold text-[#082A1C] mb-1.5">
                  Company / Organization *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-[#64707A] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={leadForm.company}
                    onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
                    placeholder="e.g. Acme Innovations Corp"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-[#082A1C] bg-[#F4F7F9] focus:bg-white placeholder:text-[#64707A]/60 focus:outline-none focus:border-[#082A1C] transition-all duration-200 ${
                      formErrors.company ? 'border-red-600' : 'border-[#DDE3E7]'
                    }`}
                  />
                </div>
                {formErrors.company && <p className="text-[11px] text-red-600 mt-1">{formErrors.company}</p>}
              </div>

              {/* Role / Job Title */}
              <div>
                <label className="block text-xs font-bold text-[#082A1C] mb-1.5">
                  Your Primary Role
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-[#64707A] absolute left-3.5 top-3" />
                  <select
                    value={leadForm.role}
                    onChange={(e) => setLeadForm({ ...leadForm, role: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DDE3E7] text-sm text-[#082A1C] bg-[#F4F7F9] focus:bg-white focus:outline-none focus:border-[#082A1C] transition-all duration-200"
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
                <label className="block text-xs font-bold text-[#082A1C] mb-1.5">
                  Planned Budget Range
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-[#64707A] absolute left-3.5 top-3" />
                  <select
                    value={leadForm.budgetRange}
                    onChange={(e) => setLeadForm({ ...leadForm, budgetRange: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DDE3E7] text-sm text-[#082A1C] bg-[#F4F7F9] focus:bg-white focus:outline-none focus:border-[#082A1C] transition-all duration-200"
                  >
                    <option value="Under $25k">
                      Under {currencySymbol}{Math.round(25000 * exchangeRate).toLocaleString()}
                    </option>
                    <option value="$25k - $50k">
                      {currencySymbol}{Math.round(25000 * exchangeRate).toLocaleString()} - {currencySymbol}{Math.round(50000 * exchangeRate).toLocaleString()}
                    </option>
                    <option value="$50k - $100k">
                      {currencySymbol}{Math.round(50000 * exchangeRate).toLocaleString()} - {currencySymbol}{Math.round(100000 * exchangeRate).toLocaleString()}
                    </option>
                    <option value="$100k - $250k">
                      {currencySymbol}{Math.round(100000 * exchangeRate).toLocaleString()} - {currencySymbol}{Math.round(250000 * exchangeRate).toLocaleString()}
                    </option>
                    <option value="$250k+">
                      {currencySymbol}{Math.round(250000 * exchangeRate).toLocaleString()}+
                    </option>
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
                  ? 'bg-white border-2 border-[#082A1C] shadow-md shadow-[#082A1C]/5'
                  : 'bg-[#F4F7F9] border-2 border-[#DDE3E7] hover:border-[#64707A]/60'
              }`}
            >
              <div
                className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                  leadForm.wantsOptionalPaidReview ? 'bg-[#082A1C] border-[#082A1C] text-[#CDFF8C]' : 'border-[#DDE3E7] bg-white'
                }`}
              >
                {leadForm.wantsOptionalPaidReview && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <div>
                <div className="text-xs font-bold text-[#082A1C]">
                  Request Senior Solutions Architect Review (Optional)
                </div>
                <p className="text-[11px] text-[#64707A] leading-normal mt-0.5">
                  Have an experienced Principal Architect independently vet your technical stack, architecture diagrams, and milestones.
                </p>
              </div>
            </button>

            {/* Mandatory Privacy & Contact Consent */}
            <div className="p-4 rounded-xl border border-[#DDE3E7] bg-[#F4F7F9]">
              <div className="flex items-start space-x-3">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={leadForm.consentGiven}
                  aria-label="Agree to Privacy Policy"
                  onClick={() => setLeadForm({ ...leadForm, consentGiven: !leadForm.consentGiven })}
                  className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                    leadForm.consentGiven ? 'bg-[#082A1C] border-[#082A1C] text-[#CDFF8C]' : 'border-[#DDE3E7] bg-white'
                  }`}
                >
                  {leadForm.consentGiven && <Check className="w-3 h-3 stroke-[3]" />}
                </button>
                <div className="text-xs text-[#64707A] leading-normal">
                  <span>I agree to the </span>
                  <button
                    type="button"
                    onClick={() => setIsPrivacyModalOpen(true)}
                    className="text-[#082A1C] font-bold underline hover:opacity-75 transition-all duration-200"
                  >
                    Privacy Policy
                  </button>
                  <span> and understand that using this estimation suite is 100% complimentary. I consent to receiving consultative communications regarding this project estimate.</span>
                </div>
              </div>
              {formErrors.consent && <p className="text-[11px] text-red-600 mt-1.5 pl-7">{formErrors.consent}</p>}
            </div>

            {submitError && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                {submitError}
              </div>
            )}

            {/* Submission Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#DDE3E7]">
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-[#082A1C] bg-[#F4F7F9] hover:bg-[#DDE3E7]/60 border border-[#DDE3E7] transition-all duration-200 active:scale-[0.98] order-2 sm:order-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Team & Rates</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl text-sm font-bold lb-btn-primary shadow-sm active:scale-[0.98] disabled:opacity-60 order-1 sm:order-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
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
