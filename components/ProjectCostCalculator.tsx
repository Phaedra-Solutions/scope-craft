'use client';

import React, { useState } from 'react';
import {
  ProjectState,
  ProjectPlatform,
  ComplexityLevel,
  DesignLevel,
  QALevel,
  MaintenancePeriod,
  FeatureCategory,
  CustomParam
} from '@/types/estimator';
import { FEATURE_CATALOG, SAAS_ADDONS } from '@/lib/estimator-data';
import {
  Globe,
  Smartphone,
  Monitor,
  Layers,
  Sparkles,
  ShieldCheck,
  Search,
  Plus,
  Trash2,
  Check,
  Wrench,
  Server,
  Cloud,
  Lock,
  Zap
} from 'lucide-react';

interface ProjectCostCalculatorProps {
  state: ProjectState;
  onChange: (updated: Partial<ProjectState>) => void;
  currencySymbol: string;
  exchangeRate: number;
}

const CATEGORY_LABELS: Record<FeatureCategory, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  auth: { label: 'Auth & Access', icon: Lock },
  monetization: { label: 'Monetization & Billing', icon: Zap },
  ai_ml: { label: 'AI & Machine Learning', icon: Sparkles },
  communication: { label: 'Realtime Chat & Push', icon: Smartphone },
  content_cms: { label: 'CMS & File Pipeline', icon: Layers },
  analytics_data: { label: 'Analytics & Search', icon: Globe },
  integrations: { label: 'Third-Party APIs', icon: Wrench },
  security_compliance: { label: 'Security & Compliance', icon: ShieldCheck },
  ui_ux_extras: { label: 'UI/UX Polish', icon: Sparkles },
  devops_cloud: { label: 'Cloud & Infrastructure', icon: Cloud }
};

export const ProjectCostCalculator: React.FC<ProjectCostCalculatorProps> = ({
  state,
  onChange,
  currencySymbol,
  exchangeRate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  const [newParamName, setNewParamName] = useState('');
  const [newParamType, setNewParamType] = useState<'fixed_cost' | 'hours'>('fixed_cost');
  const [newParamValue, setNewParamValue] = useState<number>(500);

  const togglePlatform = (p: ProjectPlatform) => {
    let nextPlatforms: ProjectPlatform[];
    if (p === 'cross_platform') {
      nextPlatforms = state.platforms.includes('cross_platform') ? [] : ['cross_platform'];
    } else {
      const filtered = state.platforms.filter((item) => item !== 'cross_platform');
      if (filtered.includes(p)) {
        nextPlatforms = filtered.filter((item) => item !== p);
      } else {
        nextPlatforms = [...filtered, p];
      }
    }
    onChange({ platforms: nextPlatforms });
  };

  const toggleFeature = (fId: string) => {
    const isSelected = state.selectedFeatureIds.includes(fId);
    const updated = isSelected
      ? state.selectedFeatureIds.filter((id) => id !== fId)
      : [...state.selectedFeatureIds, fId];
    onChange({ selectedFeatureIds: updated });
  };

  const handleAddCustomParam = () => {
    if (!newParamName.trim()) return;
    const rawVal = Number(newParamValue) || 0;
    const normalizedVal =
      newParamType === 'fixed_cost' && exchangeRate > 0 ? Math.round(rawVal / exchangeRate) : rawVal;
    const newParam: CustomParam = {
      id: `custom_${Date.now()}`,
      name: newParamName.trim(),
      category: 'Custom Line Item',
      type: newParamType,
      value: normalizedVal
    };
    onChange({ customParams: [...state.customParams, newParam] });
    setNewParamName('');
    setNewParamValue(500);
  };

  const handleRemoveCustomParam = (id: string) => {
    onChange({ customParams: state.customParams.filter((p) => p.id !== id) });
  };

  const toggleSaaS = (id: string) => {
    const isSelected = state.selectedSaaSAddons.includes(id);
    const updated = isSelected
      ? state.selectedSaaSAddons.filter((item) => item !== id)
      : [...state.selectedSaaSAddons, id];
    onChange({ selectedSaaSAddons: updated });
  };

  const filteredFeatures = FEATURE_CATALOG.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = activeCategoryFilter === 'all' || f.category === activeCategoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* 1. Target Platforms & Scope Complexity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Platforms (Rule 2 Matrix Cards) */}
        <div className="bg-white p-6 rounded-2xl border border-[#DDE3E7] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#082A1C] text-sm lb-heading flex items-center space-x-2">
              <Globe className="w-4 h-4 text-[#082A1C]" />
              <span>Target Platforms</span>
            </h3>
            <span className="text-xs text-[#64707A]">Multi-platform builds</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id: 'web', label: 'Web Application', icon: Globe, sub: 'Responsive Web' },
              { id: 'ios', label: 'Native iOS', icon: Smartphone, sub: 'Apple App Store' },
              { id: 'android', label: 'Native Android', icon: Smartphone, sub: 'Google Play' },
              { id: 'cross_platform', label: 'Cross-Platform', icon: Layers, sub: 'Flutter / React Native' },
              { id: 'desktop', label: 'Desktop App', icon: Monitor, sub: 'Electron / Tauri' }
            ].map((item) => {
              const active = state.platforms.includes(item.id as ProjectPlatform);
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => togglePlatform(item.id as ProjectPlatform)}
                  className={`p-3.5 rounded-xl text-left transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                    active
                      ? 'bg-white border-2 border-[#082A1C] shadow-md shadow-[#082A1C]/5'
                      : 'bg-[#F4F7F9] border-2 border-[#DDE3E7] hover:border-[#64707A]/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <IconComp className={`w-4 h-4 ${active ? 'text-[#082A1C]' : 'text-[#64707A]'}`} />
                    {active && (
                      <span className="w-4 h-4 rounded bg-[#CDFF8C] text-[#082A1C] flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-xs text-[#082A1C]">{item.label}</div>
                  <div className="text-[11px] text-[#64707A]">{item.sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Complexity Level (Rule 2 Matrix Cards) */}
        <div className="bg-white p-6 rounded-2xl border border-[#DDE3E7] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#082A1C] text-sm lb-heading flex items-center space-x-2">
              <Zap className="w-4 h-4 text-[#082A1C]" />
              <span>Project Complexity Tier</span>
            </h3>
            <span className="text-xs text-[#64707A]">Architecture scale multiplier</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="radiogroup" aria-label="Complexity Level">
            {[
              {
                id: 'mvp',
                label: 'MVP Prototype',
                mult: '0.9x',
                desc: 'Fast validation, lean setup, speed to market.'
              },
              {
                id: 'standard',
                label: 'Production Std',
                mult: '1.18x',
                desc: 'Scalable architecture, production polish.'
              },
              {
                id: 'enterprise',
                label: 'Enterprise Grade',
                mult: '1.55x',
                desc: 'High availability, strict auditing & security.'
              }
            ].map((item) => {
              const active = state.complexity === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onChange({ complexity: item.id as ComplexityLevel })}
                  className={`p-3.5 rounded-xl text-left transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                    active
                      ? 'bg-white border-2 border-[#082A1C] shadow-md shadow-[#082A1C]/5'
                      : 'bg-[#F4F7F9] border-2 border-[#DDE3E7] hover:border-[#64707A]/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-[#082A1C]">{item.label}</span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#CDFF8C] text-[#082A1C] tabular-nums">
                      {item.mult}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64707A] leading-tight">{item.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Design & QA Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Design Polish */}
        <div className="bg-white p-6 rounded-2xl border border-[#DDE3E7] shadow-sm">
          <h3 className="font-bold text-[#082A1C] text-sm lb-heading mb-4 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#082A1C]" />
            <span>UI/UX Design Polish Tier</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="radiogroup" aria-label="UI/UX Design Polish">
            {[
              { id: 'wireframe', title: 'System Layout', overhead: '+8%', desc: 'Clean functional layout, standard UI components' },
              { id: 'standard_ui', title: 'Custom Brand UI', overhead: '+18%', desc: 'Tailored branding, responsive design system' },
              { id: 'custom_bespoke', title: 'Bespoke Luxury', overhead: '+30%', desc: 'Custom micro-animations, high-end motion & graphics' }
            ].map((tier) => {
              const active = state.designLevel === tier.id;
              return (
                <button
                  key={tier.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onChange({ designLevel: tier.id as DesignLevel })}
                  className={`p-3.5 rounded-xl text-left transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                    active
                      ? 'bg-white border-2 border-[#082A1C] shadow-md shadow-[#082A1C]/5'
                      : 'bg-[#F4F7F9] border-2 border-[#DDE3E7] hover:border-[#64707A]/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-[#082A1C]">{tier.title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#CDFF8C] text-[#082A1C] font-bold tabular-nums">{tier.overhead}</span>
                  </div>
                  <p className="text-[11px] text-[#64707A] leading-tight">{tier.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* QA & Security Level */}
        <div className="bg-white p-6 rounded-2xl border border-[#DDE3E7] shadow-sm">
          <h3 className="font-bold text-[#082A1C] text-sm lb-heading mb-4 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#082A1C]" />
            <span>QA & Security Testing Level</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="radiogroup" aria-label="QA and Security Level">
            {[
              { id: 'basic', title: 'Manual Testing', overhead: '+8%', desc: 'Manual QA validation & basic smoke tests' },
              { id: 'standard', title: 'Automated E2E Suite', overhead: '+18%', desc: 'Playwright automated E2E & unit test coverage' },
              { id: 'automated_security', title: 'Security & Audit', overhead: '+32%', desc: 'Penetration testing, encryption & compliance audits' }
            ].map((tier) => {
              const active = state.qaLevel === tier.id;
              return (
                <button
                  key={tier.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onChange({ qaLevel: tier.id as QALevel })}
                  className={`p-3.5 rounded-xl text-left transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                    active
                      ? 'bg-white border-2 border-[#082A1C] shadow-md shadow-[#082A1C]/5'
                      : 'bg-[#F4F7F9] border-2 border-[#DDE3E7] hover:border-[#64707A]/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-[#082A1C]">{tier.title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#CDFF8C] text-[#082A1C] font-bold tabular-nums">{tier.overhead}</span>
                  </div>
                  <p className="text-[11px] text-[#64707A] leading-tight">{tier.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Feature Selection Catalog */}
      <div className="bg-white p-6 rounded-2xl border border-[#DDE3E7] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-[#082A1C] text-base lb-heading flex items-center space-x-2">
              <Layers className="w-5 h-5 text-[#082A1C]" />
              <span>Project Feature Modules</span>
            </h3>
            <p className="text-xs text-[#64707A]">
              Select functional components to build your custom software estimate
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#64707A] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search features..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F4F7F9] focus:bg-white border border-[#DDE3E7] rounded-lg text-[#082A1C] placeholder:text-[#64707A]/60 focus:outline-none focus:border-[#082A1C] transition-all duration-200"
            />
          </div>
        </div>

        {/* Category Filter Tabs (Flat Minimalism) */}
        <div className="flex items-center space-x-4 overflow-x-auto pb-1 mb-4 border-b border-[#DDE3E7] no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveCategoryFilter('all')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all duration-200 active:scale-[0.98] whitespace-nowrap ${
              activeCategoryFilter === 'all'
                ? 'border-[#082A1C] text-[#082A1C]'
                : 'border-transparent text-[#64707A] hover:text-[#082A1C]'
            }`}
          >
            All Modules ({FEATURE_CATALOG.length})
          </button>
          {(Object.keys(CATEGORY_LABELS) as FeatureCategory[]).map((catKey) => {
            const count = FEATURE_CATALOG.filter((f) => f.category === catKey).length;
            if (count === 0) return null;
            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setActiveCategoryFilter(catKey)}
                className={`pb-2.5 text-xs font-semibold border-b-2 transition-all duration-200 active:scale-[0.98] whitespace-nowrap ${
                  activeCategoryFilter === catKey
                    ? 'border-[#082A1C] text-[#082A1C]'
                    : 'border-transparent text-[#64707A] hover:text-[#082A1C]'
                }`}
              >
                {CATEGORY_LABELS[catKey].label} ({count})
              </button>
            );
          })}
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredFeatures.map((f) => {
            const selected = state.selectedFeatureIds.includes(f.id);
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleFeature(f.id)}
                className={`p-4 rounded-xl text-left transition-all duration-200 active:scale-[0.98] cursor-pointer flex flex-col justify-between ${
                  selected
                    ? 'bg-white border-2 border-[#082A1C] shadow-md shadow-[#082A1C]/5'
                    : 'bg-[#F4F7F9] border-2 border-[#DDE3E7] hover:border-[#64707A]/60'
                }`}
              >
                <div className="w-full">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="font-bold text-xs text-[#082A1C] leading-snug">{f.name}</span>
                    <div className="flex items-center space-x-1.5 flex-shrink-0">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#CDFF8C] text-[#082A1C] tabular-nums">
                        {f.baseHours} hrs
                      </span>
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border transition-all duration-200 ${
                          selected
                            ? 'bg-[#082A1C] border-[#082A1C] text-[#CDFF8C]'
                            : 'border-[#DDE3E7] bg-white'
                        }`}
                      >
                        {selected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#64707A] line-clamp-2 leading-relaxed">
                    {f.description}
                  </p>
                </div>

                <div className="w-full mt-2.5 pt-2 border-t border-[#DDE3E7] flex items-center justify-between text-[10px] text-[#64707A]">
                  <span className="uppercase tracking-wider font-semibold">
                    {CATEGORY_LABELS[f.category]?.label || f.category}
                  </span>
                  <span>Est. Dev Effort</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Custom Line Items & SaaS Add-ons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Custom Parameters */}
        <div className="bg-white p-6 rounded-2xl border border-[#DDE3E7] shadow-sm">
          <h3 className="font-bold text-[#082A1C] text-sm lb-heading mb-3 flex items-center space-x-2">
            <Plus className="w-4 h-4 text-[#082A1C]" />
            <span>Custom Scope Parameters & Add-ons</span>
          </h3>

          <div className="space-y-2 mb-4">
            {state.customParams.length === 0 ? (
              <p className="text-xs text-[#64707A] italic">No custom line items added yet.</p>
            ) : (
              state.customParams.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#F4F7F9] border border-[#DDE3E7] text-xs"
                >
                  <div>
                    <span className="font-semibold text-[#082A1C]">{p.name}</span>
                    <span className="ml-2 text-[11px] font-mono font-bold text-[#144731] tabular-nums">
                      ({p.type === 'fixed_cost' ? `${currencySymbol}${Math.round(p.value * exchangeRate).toLocaleString()}` : `${p.value} Custom Hrs`})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomParam(p.id)}
                    className="p-1 text-red-600 hover:text-red-500 transition-all duration-200 active:scale-[0.98]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="p-3.5 bg-[#F4F7F9] rounded-xl border border-[#DDE3E7] space-y-2.5">
            <input
              type="text"
              value={newParamName}
              onChange={(e) => setNewParamName(e.target.value)}
              placeholder="Custom Line Item (e.g. Third-Party Hardware BLE Audit)"
              className="w-full px-3 py-2 text-xs bg-white border border-[#DDE3E7] rounded-lg focus:outline-none focus:border-[#082A1C] text-[#082A1C] placeholder:text-[#64707A]/60 transition-all duration-200"
            />
            <div className="flex items-center space-x-2">
              <select
                value={newParamType}
                onChange={(e) => setNewParamType(e.target.value as 'fixed_cost' | 'hours')}
                className="px-2.5 py-2 text-xs bg-white border border-[#DDE3E7] rounded-lg text-[#082A1C] focus:outline-none focus:border-[#082A1C]"
              >
                <option value="fixed_cost">Fixed Cost ({currencySymbol})</option>
                <option value="hours">Custom Hours (hrs)</option>
              </select>
              <input
                type="number"
                value={newParamValue}
                onChange={(e) => setNewParamValue(Number(e.target.value))}
                className="w-24 px-2.5 py-2 text-xs bg-white border border-[#DDE3E7] rounded-lg focus:outline-none focus:border-[#082A1C] text-[#082A1C] font-mono tabular-nums"
              />
              <button
                type="button"
                onClick={handleAddCustomParam}
                className="flex-1 py-2 px-3 lb-btn-primary rounded-lg text-xs font-semibold active:scale-[0.98]"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>

        {/* SaaS & Third-Party Infrastructure Estimates */}
        <div className="bg-white p-6 rounded-2xl border border-[#DDE3E7] shadow-sm">
          <h3 className="font-bold text-[#082A1C] text-sm lb-heading mb-3 flex items-center space-x-2">
            <Server className="w-4 h-4 text-[#082A1C]" />
            <span>Estimated Third-Party SaaS & Infrastructure</span>
          </h3>

          <div className="space-y-2.5">
            {SAAS_ADDONS.map((saas) => {
              const active = state.selectedSaaSAddons.includes(saas.id);
              const estCost = Math.round(saas.monthlyEstimate * exchangeRate);
              return (
                <button
                  key={saas.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleSaaS(saas.id)}
                  className={`w-full p-3 rounded-xl text-xs cursor-pointer transition-all duration-200 active:scale-[0.98] flex items-center justify-between text-left ${
                    active
                      ? 'bg-white border-2 border-[#082A1C] shadow-md shadow-[#082A1C]/5'
                      : 'bg-[#F4F7F9] border-2 border-[#DDE3E7] hover:border-[#64707A]/60'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border ${
                        active
                          ? 'bg-[#082A1C] border-[#082A1C] text-[#CDFF8C]'
                          : 'border-[#DDE3E7] bg-white'
                      }`}
                    >
                      {active && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div>
                      <div className="font-semibold text-[#082A1C]">{saas.name}</div>
                      <div className="text-[10px] text-[#64707A]">{saas.description}</div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-[#082A1C] flex-shrink-0 pl-2 tabular-nums">
                    ~{currencySymbol}{estCost}/mo
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Post-Launch SLA Maintenance Period */}
      <div className="bg-white p-6 rounded-2xl border border-[#DDE3E7] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-[#082A1C] text-sm lb-heading flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-[#082A1C]" />
              <span>Post-Launch Maintenance & Support SLA</span>
            </h3>
            <p className="text-xs text-[#64707A]">
              Ongoing bug fixes, security updates, OS compatibility, and server monitoring
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="radiogroup" aria-label="Post-Launch Maintenance SLA">
          {[
            { id: 'none', label: 'No Retainer', desc: 'Standard warranty period' },
            { id: '3_months', label: '3 Months SLA', desc: 'Launch stability coverage' },
            { id: '6_months', label: '6 Months SLA', desc: 'Recommended scale retainer' },
            { id: '12_months', label: '12 Months SLA', desc: 'Full annual enterprise support' }
          ].map((item) => {
            const active = state.maintenancePeriod === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange({ maintenancePeriod: item.id as MaintenancePeriod })}
                className={`p-3.5 rounded-xl text-left transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                  active
                    ? 'bg-white border-2 border-[#082A1C] shadow-md shadow-[#082A1C]/5'
                    : 'bg-[#F4F7F9] border-2 border-[#DDE3E7] hover:border-[#64707A]/60'
                }`}
              >
                <div className="font-bold text-xs text-[#082A1C] mb-1">{item.label}</div>
                <div className="text-[11px] text-[#64707A]">{item.desc}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
