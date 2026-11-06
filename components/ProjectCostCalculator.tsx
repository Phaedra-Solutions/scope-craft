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

const CATEGORY_LABELS: Record<FeatureCategory, { label: string; icon: any }> = {
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
  
  // Custom Param Form State
  const [newParamName, setNewParamName] = useState('');
  const [newParamType, setNewParamType] = useState<'fixed_cost' | 'hours'>('fixed_cost');
  const [newParamValue, setNewParamValue] = useState<number>(500);

  // Platform Toggle
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

  // Feature Toggle
  const toggleFeature = (fId: string) => {
    const isSelected = state.selectedFeatureIds.includes(fId);
    const updated = isSelected
      ? state.selectedFeatureIds.filter((id) => id !== fId)
      : [...state.selectedFeatureIds, fId];
    onChange({ selectedFeatureIds: updated });
  };

  // Add Custom Parameter
  const handleAddCustomParam = () => {
    if (!newParamName.trim()) return;
    const newParam: CustomParam = {
      id: `custom_${Date.now()}`,
      name: newParamName.trim(),
      category: 'Custom Line Item',
      type: newParamType,
      value: Number(newParamValue) || 0
    };
    onChange({ customParams: [...state.customParams, newParam] });
    setNewParamName('');
    setNewParamValue(500);
  };

  const handleRemoveCustomParam = (id: string) => {
    onChange({ customParams: state.customParams.filter((p) => p.id !== id) });
  };

  // Toggle SaaS Addon
  const toggleSaaS = (id: string) => {
    const isSelected = state.selectedSaaSAddons.includes(id);
    const updated = isSelected
      ? state.selectedSaaSAddons.filter((item) => item !== id)
      : [...state.selectedSaaSAddons, id];
    onChange({ selectedSaaSAddons: updated });
  };

  // Filter Features
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
        
        {/* Platforms */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Globe className="w-4 h-4 text-blue-600" />
              <span>Target Platforms</span>
            </h3>
            <span className="text-xs text-slate-500">
              Multi-platform builds
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
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
                  onClick={() => togglePlatform(item.id as ProjectPlatform)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    active
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs ring-1 ring-blue-500'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <IconComp className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                    {active && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </div>
                  <div className="font-bold text-xs">{item.label}</div>
                  <div className="text-[10px] text-slate-500">{item.sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Complexity Level */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Project Complexity Tier</span>
            </h3>
            <span className="text-xs text-slate-500">
              Architecture scale multiplier
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
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
                  onClick={() => onChange({ complexity: item.id as ComplexityLevel })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    active
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs ring-1 ring-blue-500'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs">{item.label}</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {item.mult}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    {item.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* 2. Design & QA Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Design Polish */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>UI/UX Design Polish Tier</span>
          </h3>
          <div className="grid grid-cols-3 gap-2.5">
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
                  onClick={() => onChange({ designLevel: tier.id as DesignLevel })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    active
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs ring-1 ring-blue-500'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs">{tier.title}</span>
                    <span className="text-[10px] text-blue-600 font-semibold">{tier.overhead}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">{tier.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* QA & Security Level */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>QA & Security Testing Level</span>
          </h3>
          <div className="grid grid-cols-3 gap-2.5">
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
                  onClick={() => onChange({ qaLevel: tier.id as QALevel })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    active
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs ring-1 ring-blue-500'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs">{tier.title}</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">{tier.overhead}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">{tier.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* 3. Feature Selection Catalog */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <span>Project Feature Modules</span>
            </h3>
            <p className="text-xs text-slate-500">
              Select functional components to build your custom software estimate
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search features..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Category Filter Badges */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-3 mb-3 no-scrollbar">
          <button
            onClick={() => setActiveCategoryFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              activeCategoryFilter === 'all'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
                onClick={() => setActiveCategoryFilter(catKey)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  activeCategoryFilter === catKey
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {CATEGORY_LABELS[catKey].label} ({count})
              </button>
            );
          })}
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredFeatures.map((f) => {
            const selected = state.selectedFeatureIds.includes(f.id);
            return (
              <div
                key={f.id}
                onClick={() => toggleFeature(f.id)}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                  selected
                    ? 'border-blue-600 bg-blue-50/70 text-slate-900 shadow-xs ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="font-bold text-xs text-slate-900 leading-snug">{f.name}</span>
                    <div className="flex items-center space-x-1.5 flex-shrink-0">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {f.baseHours} hrs
                      </span>
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                          selected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {selected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {f.description}
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="uppercase tracking-wider font-semibold">
                    {CATEGORY_LABELS[f.category]?.label || f.category}
                  </span>
                  <span>Est. Dev Effort</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Custom Line Items & SaaS Add-ons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Custom Parameters */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center space-x-2">
            <Plus className="w-4 h-4 text-blue-600" />
            <span>Custom Scope Parameters & Add-ons</span>
          </h3>

          <div className="space-y-2 mb-4">
            {state.customParams.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No custom line items added yet.</p>
            ) : (
              state.customParams.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-800">{p.name}</span>
                    <span className="ml-2 text-[10px] text-slate-400">
                      ({p.type === 'fixed_cost' ? `${currencySymbol}${p.value}` : `${p.value} Custom Hrs`})
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveCustomParam(p.id)}
                    className="p-1 text-red-500 hover:text-red-700 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <input
              type="text"
              value={newParamName}
              onChange={(e) => setNewParamName(e.target.value)}
              placeholder="Custom Line Item (e.g. Third-Party Hardware BLE Audit)"
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
            />
            <div className="flex items-center space-x-2">
              <select
                value={newParamType}
                onChange={(e) => setNewParamType(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none"
              >
                <option value="fixed_cost">Fixed Cost ({currencySymbol})</option>
                <option value="hours">Custom Hours (hrs)</option>
              </select>
              <input
                type="number"
                value={newParamValue}
                onChange={(e) => setNewParamValue(Number(e.target.value))}
                className="w-24 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none text-slate-900"
              />
              <button
                type="button"
                onClick={handleAddCustomParam}
                className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>

        {/* SaaS & Third-Party Infrastructure Estimates */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center space-x-2">
            <Server className="w-4 h-4 text-emerald-600" />
            <span>Estimated Third-Party SaaS & Infrastructure</span>
          </h3>

          <div className="space-y-2">
            {SAAS_ADDONS.map((saas) => {
              const active = state.selectedSaaSAddons.includes(saas.id);
              const estCost = Math.round(saas.monthlyCost * exchangeRate);
              return (
                <div
                  key={saas.id}
                  onClick={() => toggleSaaS(saas.id)}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                    active
                      ? 'border-emerald-600 bg-emerald-50/60 text-slate-900 ring-1 ring-emerald-500'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border ${
                        active
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {active && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">{saas.name}</div>
                      <div className="text-[10px] text-slate-400">{saas.description}</div>
                    </div>
                  </div>
                  <span className="font-bold text-emerald-700 flex-shrink-0 pl-2">
                    ~{currencySymbol}{estCost}/mo
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 5. Post-Launch SLA Maintenance Period */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Post-Launch Maintenance & Support SLA</span>
            </h3>
            <p className="text-xs text-slate-500">
              Ongoing bug fixes, security updates, OS compatibility, and server monitoring
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                onClick={() => onChange({ maintenancePeriod: item.id as MaintenancePeriod })}
                className={`p-3 rounded-xl border text-left transition ${
                  active
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="font-bold text-xs mb-1">{item.label}</div>
                <div className="text-[10px] text-slate-500">{item.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
