'use client';

import React from 'react';
import { ProjectState } from '@/types/estimator';
import { PRESET_TEMPLATES } from '@/lib/estimator-data';
import {
  X,
  Rocket,
  Smartphone,
  Sparkles,
  ShieldCheck,
  ShoppingBag,
  ArrowRight,
  Check
} from 'lucide-react';

interface PresetSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (presetState: Partial<ProjectState>) => void;
}

const PRESET_ICONS: Record<string, any> = {
  Rocket,
  Smartphone,
  Sparkles,
  ShieldCheck,
  ShoppingBag
};

export const PresetSelectorModal: React.FC<PresetSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              Select Industry Scope Preset
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Load benchmark feature matrix and team setups for popular software archetypes
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="p-6 space-y-3 flex-1">
          {PRESET_TEMPLATES.map((tmpl) => {
            const IconComp = PRESET_ICONS[tmpl.icon] || Rocket;
            return (
              <div
                key={tmpl.id}
                onClick={() => {
                  onSelectPreset(tmpl.state);
                  onClose();
                }}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-600 hover:bg-blue-50/40 transition-all cursor-pointer flex items-center justify-between group shadow-2xs"
              >
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex-shrink-0 group-hover:scale-105 transition">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-sm text-slate-900">{tmpl.title}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {tmpl.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {tmpl.description}
                    </p>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 group-hover:text-blue-600 transition flex-shrink-0 ml-3">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
