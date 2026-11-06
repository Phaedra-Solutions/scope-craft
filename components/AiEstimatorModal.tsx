'use client';

import React, { useState } from 'react';
import { ProjectState } from '@/types/estimator';
import { generateRecommendedTeam } from '@/lib/estimator-engine';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Bot
} from 'lucide-react';

interface AiEstimatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyAiResult: (updated: Partial<ProjectState>) => void;
}

export const AiEstimatorModal: React.FC<AiEstimatorModalProps> = ({
  isOpen,
  onClose,
  onApplyAiResult
}) => {
  const [promptInput, setPromptInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<any | null>(null);

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

      setAiResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while calling Gemini AI.');
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-purple-900/10 to-indigo-900/10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                AI Project Scope & Cost Architect
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Powered by Gemini 3.6 Flash for intelligent scope breakdown
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 flex-1">
          
          {/* Prompt Input Box */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Describe your software project, features, or PRD requirements:
            </label>
            <textarea
              rows={3}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="e.g. Telehealth mobile app for iOS and Android with video appointments, AI medical transcript summaries, Stripe payment gateway, and HIPAA compliance..."
              className="w-full p-3 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            {/* Quick Example Chips */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-zinc-400 font-medium">Examples:</span>
              {[
                'Fintech app with AI spending insights & Plaid',
                'Uber for home services with realtime tracking & Stripe',
                'Enterprise AI RAG document search portal'
              ].map((ex, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPromptInput(ex)}
                  className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-purple-100 dark:hover:bg-purple-950 text-zinc-600 dark:text-zinc-400 text-[10px] transition"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Action Trigger */}
          <button
            onClick={handleGenerate}
            disabled={loading || !promptInput.trim()}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2"
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
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* AI Output Panel */}
          {aiResult && (
            <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 animate-in fade-in duration-300">
              
              <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-purple-900 dark:text-purple-200">
                    {aiResult.projectName}
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 uppercase">
                    {aiResult.complexity} Tier
                  </span>
                </div>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {aiResult.executiveSummary}
                </p>
              </div>

              {/* Architectural Risks */}
              {aiResult.keyArchitecturalRisks?.length > 0 && (
                <div className="space-y-1">
                  <h5 className="font-bold text-xs text-zinc-800 dark:text-zinc-200 flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span>Architectural & Risk Factors</span>
                  </h5>
                  <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1 pl-5 list-disc">
                    {aiResult.keyArchitecturalRisks.map((risk: string, i: number) => (
                      <li key={i}>{risk}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Cost Optimization Tips */}
              {aiResult.costOptimizationTips?.length > 0 && (
                <div className="space-y-1">
                  <h5 className="font-bold text-xs text-zinc-800 dark:text-zinc-200 flex items-center space-x-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Cost Optimization Strategy</span>
                  </h5>
                  <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1 pl-5 list-disc">
                    {aiResult.costOptimizationTips.map((tip: string, i: number) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Apply Button */}
              <button
                onClick={handleApply}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2"
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
