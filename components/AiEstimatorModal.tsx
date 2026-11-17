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
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700/50 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-700/50 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">
                AI Project Scope & Cost Architect
              </h3>
              <p className="text-xs text-slate-400">
                Intelligent architectural breakdown and module recommendation engine
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-700 rounded-lg transition-all duration-200 active:scale-[0.98]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 flex-1">
          {/* Prompt Input Box */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-300">
              Describe your software project, features, or PRD requirements:
            </label>
            <textarea
              rows={3}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="e.g. Telehealth mobile app for iOS and Android with video appointments, AI medical transcript summaries, Stripe payment gateway, and HIPAA compliance..."
              className="w-full p-3.5 text-xs bg-slate-900/70 border border-slate-700/50 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-all duration-200"
            />

            {/* Quick Example Chips */}
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="text-slate-400 font-medium">Examples:</span>
              {[
                'Fintech app with AI spending insights & Plaid',
                'On-demand home services with realtime tracking & Stripe',
                'Enterprise AI RAG document search portal'
              ].map((ex, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPromptInput(ex)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900/60 hover:bg-indigo-500/20 border border-slate-700/50 hover:border-indigo-500/40 text-slate-300 text-[11px] transition-all duration-200 active:scale-[0.98]"
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
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 transition-all duration-200 active:scale-[0.98] flex items-center justify-center space-x-2"
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
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* AI Output Panel */}
          {aiResult && (
            <div className="space-y-4 pt-4 border-t border-slate-700/50">
              <div className="p-4 bg-slate-900/60 border border-indigo-500/30 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-100">
                    {aiResult.projectName}
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 uppercase">
                    {aiResult.complexity} Tier
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {aiResult.executiveSummary}
                </p>
              </div>

              {/* Architectural Risks */}
              {aiResult.keyArchitecturalRisks && aiResult.keyArchitecturalRisks.length > 0 && (
                <div className="space-y-1.5">
                  <h5 className="font-bold text-xs text-slate-200 flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Architectural & Risk Factors</span>
                  </h5>
                  <ul className="text-xs text-slate-400 space-y-1 pl-5 list-disc">
                    {aiResult.keyArchitecturalRisks.map((risk, i) => (
                      <li key={i}>{risk}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Cost Optimization Tips */}
              {aiResult.costOptimizationTips && aiResult.costOptimizationTips.length > 0 && (
                <div className="space-y-1.5">
                  <h5 className="font-bold text-xs text-slate-200 flex items-center space-x-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Cost Optimization Strategy</span>
                  </h5>
                  <ul className="text-xs text-slate-400 space-y-1 pl-5 list-disc">
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
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition-all duration-200 active:scale-[0.98] flex items-center justify-center space-x-2"
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
