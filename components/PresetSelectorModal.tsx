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
  ArrowRight
} from 'lucide-react';

interface PresetSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (presetState: Partial<ProjectState>) => void;
}

const PRESET_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
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
    <div className="fixed inset-0 z-50 bg-[#082A1C]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-[#DDE3E7] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#DDE3E7] flex items-center justify-between bg-[#F4F7F9]">
          <div>
            <h3 className="font-bold text-base text-[#082A1C] lb-heading">
              Select Industry Scope Preset
            </h3>
            <p className="text-xs text-[#64707A]">
              Load benchmark feature matrix and team setups for popular software archetypes
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#64707A] hover:text-[#082A1C] hover:bg-[#DDE3E7]/60 rounded-lg transition-all duration-200 active:scale-[0.98]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="p-6 space-y-3 flex-1">
          {PRESET_TEMPLATES.map((tmpl) => {
            const IconComp = PRESET_ICONS[tmpl.icon] || Rocket;
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => {
                  onSelectPreset(tmpl.state);
                  onClose();
                }}
                className="w-full p-4 rounded-xl bg-[#F4F7F9] border-2 border-[#DDE3E7] hover:border-[#082A1C] hover:bg-white transition-all duration-200 active:scale-[0.98] cursor-pointer flex items-center justify-between group text-left"
              >
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-xl bg-[#082A1C] text-[#CDFF8C] flex-shrink-0">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-sm text-[#082A1C]">{tmpl.title}</h4>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#CDFF8C] text-[#082A1C]">
                        {tmpl.badge}
                      </span>
                    </div>
                    <p className="text-xs text-[#64707A] mt-1 leading-relaxed">
                      {tmpl.description}
                    </p>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-white border border-[#DDE3E7] text-[#64707A] group-hover:bg-[#082A1C] group-hover:text-[#CDFF8C] group-hover:border-[#082A1C] transition-all duration-200 flex-shrink-0 ml-3">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
