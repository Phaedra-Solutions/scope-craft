'use client';

import React, { useState } from 'react';
import { ProjectState } from '@/types/estimator';
import { generateRecommendedTeam } from '@/lib/estimator-engine';
import {
  Sparkles,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Bot
} from 'lucide-react';

interface AiEstimatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyAiResult: (updated: Partial<ProjectState>) => void;
}

interface AiEstimateResponse {
  projectName?: string;
  platforms?: ProjectState['platforms'];
  complexity?: ProjectState['complexity'];
  designLevel?: ProjectState['designLevel'];
  qaLevel?: ProjectState['qaLevel'];
  targetTimelineWeeks?: number;
  recommendedFeatureIds?: string[];
  executiveSummary?: string;
  keyArchitecturalRisks?: string[];
  costOptimizationTips?: string[];
}

export const AiEstimatorModal: React.FC<AiEstimatorModalProps> = ({
  isOpen,
  onClose,
  onApplyAiResult
}) => {
  const [promptInput, setPromptInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AiEstimateResponse | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!promptInput.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/estimate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptInput.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'AI estimation failed');
      }

      setAiResult(data as AiEstimateResponse);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while calling Gemini AI.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!aiResult) return;

    const recommendedTeam = generateRecommendedTeam(
      aiResult.recommendedFeatureIds || [],
      aiResult.platforms || ['web'],
      aiResult.complexity || 'standard',
      aiResult.designLevel || 'standard_ui'
    );

    onApplyAiResult({
      projectName: aiResult.projectName || 'AI Generated Project',
      platforms: aiResult.platforms || ['web'],
      complexity: aiResult.complexity || 'standard',
      designLevel: aiResult.designLevel || 'standard_ui',
      qaLevel: aiResult.qaLevel || 'standard',
      targetTimelineWeeks: aiResult.targetTimelineWeeks || 12,
      selectedFeatureIds: aiResult.recommendedFeatureIds || [],
      team: recommendedTeam
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#082A1C]/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-[#DDE3E7] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#DDE3E7] flex items-center justify-between bg-[#F4F7F9]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#082A1C] text-[#CDFF8C] shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#082A1C] lb-heading">
                AI Project Scope & Cost Architect
              </h3>
              <p className="text-xs text-[#64707A]">
                Intelligent architectural breakdown and module recommendation engine
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#64707A] hover:text-[#082A1C] hover:bg-[#DDE3E7]/60 rounded-lg transition-all duration-200 active:scale-[0.98]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 flex-1">
          {/* Prompt Input Box */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-[#082A1C]">
              Describe your software project, features, or PRD requirements:
            </label>
            <textarea
              rows={3}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="e.g. Telehealth mobile app for iOS and Android with video appointments, AI medical transcript summaries, Stripe payment gateway, and HIPAA compliance..."
              className="w-full p-3.5 text-xs bg-[#F4F7F9] focus:bg-white border border-[#DDE3E7] rounded-xl text-[#082A1C] placeholder:text-[#64707A]/60 focus:outline-none focus:border-[#082A1C] transition-all duration-200"
            />

            {/* Quick Example Chips */}
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="text-[#64707A] font-medium">Examples:</span>
              {[
                'Fintech app with AI spending insights & Plaid',
                'On-demand home services with realtime tracking & Stripe',
                'Enterprise AI RAG document search portal'
              ].map((ex, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPromptInput(ex)}
                  className="px-2.5 py-1 rounded-lg bg-[#F4F7F9] hover:bg-[#CDFF8C] border border-[#DDE3E7] hover:border-[#082A1C] text-[#082A1C] text-[11px] transition-all duration-200 active:scale-[0.98]"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Action Trigger */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !promptInput.trim()}
            className="w-full py-3 px-4 lb-btn-primary disabled:opacity-50 font-bold text-xs rounded-xl shadow-sm active:scale-[0.98] flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing Project Requirements...</span>
              </>
            ) : (
              <>
                <Bot className="w-4 h-4" />
                <span>Generate Scope Breakdown & Estimate</span>
              </>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* AI Output Panel */}
          {aiResult && (
            <div className="space-y-4 pt-4 border-t border-[#DDE3E7]">
              <div className="p-4 bg-[#082A1C] text-white rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-white lb-heading">
                    {aiResult.projectName}
                  </h4>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#CDFF8C] text-[#082A1C] uppercase">
                    {aiResult.complexity} Tier
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  {aiResult.executiveSummary}
                </p>
              </div>

              {/* Architectural Risks */}
              {aiResult.keyArchitecturalRisks && aiResult.keyArchitecturalRisks.length > 0 && (
                <div className="space-y-1.5">
                  <h5 className="font-bold text-xs text-[#082A1C] flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Architectural & Risk Factors</span>
                  </h5>
                  <ul className="text-xs text-[#64707A] space-y-1 pl-5 list-disc">
                    {aiResult.keyArchitecturalRisks.map((risk, i) => (
                      <li key={i}>{risk}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Cost Optimization Tips */}
              {aiResult.costOptimizationTips && aiResult.costOptimizationTips.length > 0 && (
                <div className="space-y-1.5">
                  <h5 className="font-bold text-xs text-[#082A1C] flex items-center space-x-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-[#082A1C]" />
                    <span>Cost Optimization Strategy</span>
                  </h5>
                  <ul className="text-xs text-[#64707A] space-y-1 pl-5 list-disc">
                    {aiResult.costOptimizationTips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Apply Button */}
              <button
                type="button"
                onClick={handleApply}
                className="w-full py-3 px-4 lb-btn-lime border border-[#082A1C]/20 font-bold text-xs rounded-xl shadow-sm active:scale-[0.98] flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Apply AI Recommended Parameters to Workspace</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
