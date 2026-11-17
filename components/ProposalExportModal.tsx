'use client';

import React, { useState, useRef } from 'react';
import { ProjectState, EstimateResult, LeadProfile } from '@/types/estimator';
import { FEATURE_CATALOG, TEAM_ROLES, REGIONS } from '@/lib/estimator-data';
import { sendLeadToGHL } from '@/lib/ghl-sync';
import {
  downloadFile,
  exportToPdf,
  printHtmlReport,
  generateCsvContent,
  generateMarkdownContent,
  generateHtmlReport
} from '@/lib/export-helpers';
import {
  X,
  Printer,
  Download,
  Check,
  FileText,
  Copy,
  Table,
  FileCode,
  FileJson,
  Upload,
  Sparkles,
  Layers,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileDown
} from 'lucide-react';

export type ExportTab = 'sow' | 'csv' | 'markdown' | 'json';

interface ProposalExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: ProjectState;
  estimate: EstimateResult;
  currencySymbol: string;
  exchangeRate: number;
  onImportState?: (state: ProjectState) => void;
  leadProfile?: LeadProfile | null;
}

export const ProposalExportModal: React.FC<ProposalExportModalProps> = ({
  isOpen,
  onClose,
  state,
  estimate,
  currencySymbol,
  exchangeRate,
  onImportState,
  leadProfile
}) => {
  const [activeTab, setActiveTab] = useState<ExportTab>('sow');
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [importStatusMessage, setImportStatusMessage] = useState<string | null>(null);
  const [importErrorMessage, setImportErrorMessage] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [vettingRequested, setVettingRequested] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const convertedGrandTotal = Math.round(estimate.grandTotalCost * exchangeRate);
  const convertedBaseLabor = Math.round(estimate.baseLaborCost * exchangeRate);
  const convertedContingency = Math.round(estimate.contingencyAmount * exchangeRate);
  const convertedMaintenance = Math.round(estimate.maintenanceCost * exchangeRate);
  const convertedSaaSMonthly = Math.round(estimate.monthlySaaSCost * exchangeRate);
  const region = REGIONS.find((r) => r.id === state.regionId) || REGIONS[0];

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const sanitizeFilename = (name: string) => {
    return (name || 'Software_Proposal').replace(/[^a-zA-Z0-9_-]/g, '_');
  };

  const handleCopy = (content: string, formatKey: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFormat(formatKey);
    setTimeout(() => {
      setCopiedFormat(null);
    }, 2500);
  };

  const handleExportPdf = async () => {
    setIsGeneratingPdf(true);
    if (leadProfile) {
      sendLeadToGHL(leadProfile, state, estimate, 'scope_updated', 'download_pdf').catch(() => {});
    }
    const filename = `${sanitizeFilename(state.projectName)}_SOW_Proposal.pdf`;
    const success = await exportToPdf('printable-proposal', filename);
    if (!success) {
      handleDownloadHtml();
      handlePrint();
    }
    setIsGeneratingPdf(false);
  };

  const handlePrint = () => {
    if (leadProfile) {
      sendLeadToGHL(leadProfile, state, estimate, 'scope_updated', 'print_dialog').catch(() => {});
    }
    const html = generateHtmlReport(state, estimate, currencySymbol, exchangeRate);
    printHtmlReport(html);
  };

  const handleRequestArchitectReview = async () => {
    if (leadProfile) {
      setVettingRequested(true);
      await sendLeadToGHL(
        { ...leadProfile, wantsOptionalPaidReview: true },
        state,
        estimate,
        'scope_updated',
        'request_architect_review'
      );
      setTimeout(() => setVettingRequested(false), 5000);
    }
  };

  const handleDownloadHtml = () => {
    if (leadProfile) {
      sendLeadToGHL(leadProfile, state, estimate, 'scope_updated', 'download_html').catch(() => {});
    }
    const html = generateHtmlReport(state, estimate, currencySymbol, exchangeRate);
    downloadFile(`${sanitizeFilename(state.projectName)}_SOW.html`, html, 'text/html');
  };

  const handleDownloadCsv = () => {
    const csv = generateCsvContent(state, estimate, currencySymbol, exchangeRate);
    downloadFile(`${sanitizeFilename(state.projectName)}_Estimate.csv`, csv, 'text/csv;charset=utf-8;');
  };

  const handleDownloadMarkdown = () => {
    const md = generateMarkdownContent(state, estimate, currencySymbol, exchangeRate);
    downloadFile(`${sanitizeFilename(state.projectName)}_Proposal.md`, md, 'text/markdown;charset=utf-8;');
  };

  const handleDownloadJson = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      projectState: state,
      estimateResult: estimate
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    downloadFile(`${sanitizeFilename(state.projectName)}_State.json`, jsonStr, 'application/json');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportErrorMessage(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const importedState: ProjectState = parsed.projectState || parsed;

        if (!importedState.projectName || !Array.isArray(importedState.selectedFeatureIds)) {
          throw new Error('Invalid project state format');
        }

        if (onImportState) {
          onImportState(importedState);
          setImportStatusMessage(`Successfully restored estimate for "${importedState.projectName}"!`);
          setTimeout(() => setImportStatusMessage(null), 4000);
        }
      } catch {
        setImportErrorMessage('Failed to parse JSON file. Please ensure it is a valid project estimate export.');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const csvContent = generateCsvContent(state, estimate, currencySymbol, exchangeRate);
  const markdownContent = generateMarkdownContent(state, estimate, currencySymbol, exchangeRate);
  const jsonContent = JSON.stringify({ version: '1.0', exportedAt: new Date().toISOString(), projectState: state }, null, 2);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-800 border border-slate-700/50 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl my-8 flex flex-col print-container-root">
        {/* Action Header Bar (Hidden in Print) */}
        <div className="p-4 sm:p-5 border-b border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/60 gap-3 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-100 block">
                Export & Share Cost Proposal
              </span>
              <p className="text-[11px] text-slate-400">
                Generate formal Statement of Work (SOW), CSV spreadsheets, or Markdown docs
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 transition-all duration-200 active:scale-[0.98] rounded-lg hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation (Rule 1 Flat Minimalism, Hidden in Print) */}
        <div className="px-6 pt-2 bg-slate-900/40 border-b border-slate-800 flex items-center space-x-4 overflow-x-auto print:hidden no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('sow')}
            className={`flex items-center space-x-2 px-2 py-2.5 text-xs font-semibold border-b-2 transition-all duration-200 active:scale-[0.98] whitespace-nowrap ${
              activeTab === 'sow'
                ? 'border-indigo-500 text-slate-100'
                : 'border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Formal SOW Proposal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('csv')}
            className={`flex items-center space-x-2 px-2 py-2.5 text-xs font-semibold border-b-2 transition-all duration-200 active:scale-[0.98] whitespace-nowrap ${
              activeTab === 'csv'
                ? 'border-indigo-500 text-slate-100'
                : 'border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>CSV Spreadsheet</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('markdown')}
            className={`flex items-center space-x-2 px-2 py-2.5 text-xs font-semibold border-b-2 transition-all duration-200 active:scale-[0.98] whitespace-nowrap ${
              activeTab === 'markdown'
                ? 'border-indigo-500 text-slate-100'
                : 'border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Markdown Document</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('json')}
            className={`flex items-center space-x-2 px-2 py-2.5 text-xs font-semibold border-b-2 transition-all duration-200 active:scale-[0.98] whitespace-nowrap ${
              activeTab === 'json'
                ? 'border-indigo-500 text-slate-100'
                : 'border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <FileJson className="w-4 h-4" />
            <span>JSON State & Restore</span>
          </button>
        </div>

        {/* Tab 1: Printable SOW Proposal Document */}
        {activeTab === 'sow' && (
          <div className="flex-1 overflow-y-auto">
            {/* Action Bar */}
            <div className="p-4 bg-slate-800/80 border-b border-slate-700/50 flex flex-wrap items-center justify-between gap-2 print:hidden">
              <span className="text-xs text-slate-400 font-medium">
                Ready for client signoff & PDF presentation
              </span>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(generateMarkdownContent(state, estimate, currencySymbol, exchangeRate), 'sow')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-900/70 border border-slate-700/50 hover:bg-slate-700 transition-all duration-200 active:scale-[0.98]"
                >
                  {copiedFormat === 'sow' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Summary</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadHtml}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 hover:bg-indigo-500/25 transition-all duration-200 active:scale-[0.98]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download HTML</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isGeneratingPdf}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 shadow-md shadow-indigo-500/20 transition-all duration-200 active:scale-[0.98]"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-300" />
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-3.5 h-3.5" />
                      <span>Export PDF Document</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-200 bg-slate-700 hover:bg-slate-600 transition-all duration-200 active:scale-[0.98]"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Dialog</span>
                </button>

                {leadProfile && (
                  <button
                    type="button"
                    onClick={handleRequestArchitectReview}
                    disabled={vettingRequested}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-200 bg-slate-900/70 border border-slate-700/50 hover:bg-slate-700 transition-all duration-200 active:scale-[0.98]"
                    title="Request an experienced Solutions Architect to formally review your scope"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{vettingRequested ? 'Review Requested!' : 'Request Architect Vetting'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Printable Proposal Paper Sheet (Kept Crisp White for Client-Ready PDF Export) */}
            <div className="bg-slate-900/70 p-4 sm:p-6 print:p-0 print:bg-white">
              <div id="printable-proposal" className="printable-document-container p-8 sm:p-12 space-y-8 bg-white text-slate-900 rounded-xl shadow-lg print:shadow-none print:rounded-none print:text-black print:p-0">
                {/* Document Letterhead */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-6 border-slate-200 gap-4">
                  <div>
                    <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">
                      Formal Statement of Work (SOW)
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                      {state.projectName || 'Software Development Project'}
                    </h1>
                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                      <span>Date: {currentDate}</span>
                      <span>•</span>
                      <span>Client: {state.clientName || 'N/A'}</span>
                      <span>•</span>
                      <span>Region Hub: {region.flag} {region.name}</span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Investment Quote</span>
                    <span className="text-3xl font-black text-slate-900">
                      {currencySymbol}{convertedGrandTotal.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {estimate.estimatedTimelineWeeks} Weeks (~{estimate.totalHours} hrs)
                    </span>
                  </div>
                </div>

                {/* Executive Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Development Labor</span>
                    <span className="font-bold text-sm text-slate-900">
                      {currencySymbol}{convertedBaseLabor.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Contingency Buffer ({state.contingencyBufferPercent}%)</span>
                    <span className="font-bold text-sm text-amber-600">
                      {currencySymbol}{convertedContingency.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Maintenance Retainer</span>
                    <span className="font-bold text-sm text-indigo-600">
                      {currencySymbol}{convertedMaintenance.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Monthly SaaS Infra</span>
                    <span className="font-bold text-sm text-emerald-600">
                      {currencySymbol}{convertedSaaSMonthly.toLocaleString()}/mo
                    </span>
                  </div>
                </div>

                {/* Itemized Scope Modules Table */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>Itemized Technical Scope Modules ({state.selectedFeatureIds.length})</span>
                  </h3>

                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                          <th className="p-3 font-semibold">Feature Module</th>
                          <th className="p-3 font-semibold">Category</th>
                          <th className="p-3 font-semibold text-right">Est. Effort</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {state.selectedFeatureIds.map((id) => {
                          const f = FEATURE_CATALOG.find((item) => item.id === id);
                          return (
                            <tr key={id}>
                              <td className="p-3 font-semibold text-slate-800">
                                {f?.name || id}
                                <p className="text-[10px] text-slate-500 font-normal">{f?.description}</p>
                              </td>
                              <td className="p-3 text-slate-600 capitalize">{f?.category.replace('_', ' ')}</td>
                              <td className="p-3 text-right font-bold text-indigo-600">
                                {f?.baseHours || 0} hrs
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Assigned Team Squad */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center space-x-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Dedicated Engineering Squad</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {state.team.map((m) => {
                      const r = TEAM_ROLES.find((item) => item.id === m.roleId);
                      return (
                        <div
                          key={m.id}
                          className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-slate-800">
                              {m.count}x {r?.title || m.roleId}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {m.experienceLevel.toUpperCase()} • {m.engagement.replace('_', ' ')}
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-1 rounded bg-slate-200 text-slate-700">
                            {region.flag} {region.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Milestone Payment Roadmap */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Milestone Payment Schedule
                  </h3>

                  <div className="space-y-2 text-xs">
                    {estimate.phaseBreakdown.map((phase, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-slate-200 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-800">{phase.phase}</div>
                          <div className="text-[10px] text-slate-500">{phase.description}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-indigo-600">
                            {currencySymbol}{Math.round(phase.cost * exchangeRate).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-500">{phase.percentage}% of Base Labor</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Terms & Signoff Footer */}
                <div className="pt-6 border-t border-slate-200 text-[11px] text-slate-500 space-y-2">
                  <p className="font-semibold text-slate-700">
                    Terms & Acceptance Conditions:
                  </p>
                  <p>
                    This estimate is valid for 30 days. Final contract statement of work will include detailed sprint deliverables, code repository transfer rights, and SLA bug-fix commitments.
                  </p>
                  <p className="text-[10px] text-slate-400 pt-1 text-center">
                    &copy; {new Date().getFullYear()} Phaedra Solutions. All rights reserved. Generated with ScopeCraft.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: CSV Spreadsheet Export */}
        {activeTab === 'csv' && (
          <div className="p-6 space-y-4 flex-1 overflow-y-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-700/50">
              <div>
                <h4 className="font-bold text-sm text-slate-100 flex items-center space-x-2">
                  <Table className="w-4 h-4 text-emerald-500" />
                  <span>CSV Spreadsheet Export</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Compatible with Microsoft Excel, Google Sheets, and CRM tools.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleCopy(csvContent, 'csv')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 border border-slate-700/50 hover:bg-slate-700 transition-all duration-200 active:scale-[0.98]"
                >
                  {copiedFormat === 'csv' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy CSV</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition-all duration-200 active:scale-[0.98]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .CSV File</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <pre className="p-4 rounded-2xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto max-h-[50vh] leading-relaxed border border-slate-800">
                {csvContent}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 3: Markdown Document Export */}
        {activeTab === 'markdown' && (
          <div className="p-6 space-y-4 flex-1 overflow-y-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-700/50">
              <div>
                <h4 className="font-bold text-sm text-slate-100 flex items-center space-x-2">
                  <FileCode className="w-4 h-4 text-indigo-400" />
                  <span>Markdown Proposal Document</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Formatted for Notion, GitHub, Slack, and developer documentation.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleCopy(markdownContent, 'markdown')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 border border-slate-700/50 hover:bg-slate-700 transition-all duration-200 active:scale-[0.98]"
                >
                  {copiedFormat === 'markdown' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Markdown</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadMarkdown}
                  className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20 transition-all duration-200 active:scale-[0.98]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .MD File</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <pre className="p-4 rounded-2xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto max-h-[50vh] leading-relaxed border border-slate-800 whitespace-pre-wrap">
                {markdownContent}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 4: JSON State & Backup Import */}
        {activeTab === 'json' && (
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            {importStatusMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>{importStatusMessage}</span>
              </div>
            )}

            {importErrorMessage && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{importErrorMessage}</span>
              </div>
            )}

            <div className="p-5 rounded-2xl border-2 border-dashed border-indigo-500/40 bg-indigo-500/10 flex flex-col items-center justify-center text-center space-y-2">
              <Upload className="w-8 h-8 text-indigo-400" />
              <h4 className="font-bold text-sm text-slate-100">Restore or Import Saved Estimate JSON</h4>
              <p className="text-xs text-slate-400 max-w-md">
                Upload a previously exported `.json` file to instantly restore feature choices, team headcount, and pricing calculations.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all duration-200 active:scale-[0.98] cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload JSON File</span>
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-700/50">
                <div>
                  <h4 className="font-bold text-sm text-slate-100 flex items-center space-x-2">
                    <FileJson className="w-4 h-4 text-indigo-400" />
                    <span>Raw JSON State Backup</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Backup full project state parameters for future reload or developer API usage.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(jsonContent, 'json')}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 border border-slate-700/50 hover:bg-slate-700 transition-all duration-200 active:scale-[0.98]"
                  >
                    {copiedFormat === 'json' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadJson}
                    className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20 transition-all duration-200 active:scale-[0.98]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .JSON State</span>
                  </button>
                </div>
              </div>

              <pre className="p-4 rounded-2xl bg-slate-900 text-emerald-400/90 font-mono text-xs overflow-x-auto max-h-[35vh] leading-relaxed border border-slate-800">
                {jsonContent}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
