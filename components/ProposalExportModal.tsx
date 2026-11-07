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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [vettingRequested, setVettingRequested] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const convertedGrandTotal = Math.round(estimate.grandTotalCost * exchangeRate);
  const convertedBaseLabor = Math.round(estimate.baseLaborCost * exchangeRate);
  const convertedContingency = Math.round(estimate.contingencyAmount * exchangeRate);
  const convertedProfit = Math.round(estimate.profitMarginAmount * exchangeRate);
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

  // 1. Copy Handler with Feedback
  const handleCopy = (content: string, formatKey: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFormat(formatKey);
    setTimeout(() => {
      setCopiedFormat(null);
    }, 2500);
  };

  // 2. Direct PDF Export Handler (Generates and downloads PDF file directly)
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

  // 3. Print Document Dialog
  const handlePrint = () => {
    if (leadProfile) {
      sendLeadToGHL(leadProfile, state, estimate, 'scope_updated', 'print_dialog').catch(() => {});
    }
    const html = generateHtmlReport(state, estimate, currencySymbol, exchangeRate);
    printHtmlReport(html);
  };

  // 4. Request Optional Senior Architect Review
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

  // 5. Download HTML Report
  const handleDownloadHtml = () => {
    if (leadProfile) {
      sendLeadToGHL(leadProfile, state, estimate, 'scope_updated', 'download_html').catch(() => {});
    }
    const html = generateHtmlReport(state, estimate, currencySymbol, exchangeRate);
    downloadFile(`${sanitizeFilename(state.projectName)}_SOW.html`, html, 'text/html');
  };

  // 4. Download CSV Spreadsheet
  const handleDownloadCsv = () => {
    const csv = generateCsvContent(state, estimate, currencySymbol, exchangeRate);
    downloadFile(`${sanitizeFilename(state.projectName)}_Estimate.csv`, csv, 'text/csv;charset=utf-8;');
  };

  // 5. Download Markdown
  const handleDownloadMarkdown = () => {
    const md = generateMarkdownContent(state, estimate, currencySymbol, exchangeRate);
    downloadFile(`${sanitizeFilename(state.projectName)}_Proposal.md`, md, 'text/markdown;charset=utf-8;');
  };

  // 6. Download JSON Backup
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

  // 7. Import JSON File Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      } catch (err) {
        alert('Failed to parse JSON file. Please ensure it is a valid project estimate export.');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // Generated Text Contents
  const csvContent = generateCsvContent(state, estimate, currencySymbol, exchangeRate);
  const markdownContent = generateMarkdownContent(state, estimate, currencySymbol, exchangeRate);
  const jsonContent = JSON.stringify({ version: '1.0', exportedAt: new Date().toISOString(), projectState: state }, null, 2);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl my-8 flex flex-col print-container-root">
        
        {/* Action Header Bar (Hidden in Print) */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between bg-zinc-50 dark:bg-zinc-800/80 gap-3 print:hidden">
          
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 block">
                Export & Share Cost Proposal
              </span>
              <p className="text-[11px] text-slate-500">
                Generate formal Statement of Work (SOW), CSV spreadsheets, or Markdown docs
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 transition rounded-lg hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        </div>

        {/* Tab Navigation (Hidden in Print) */}
        <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex items-center space-x-2 overflow-x-auto print:hidden no-scrollbar">
          
          <button
            onClick={() => setActiveTab('sow')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
              activeTab === 'sow'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Formal SOW Proposal</span>
          </button>

          <button
            onClick={() => setActiveTab('csv')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
              activeTab === 'csv'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>CSV Spreadsheet</span>
          </button>

          <button
            onClick={() => setActiveTab('markdown')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
              activeTab === 'markdown'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Markdown Document</span>
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
              activeTab === 'json'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
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
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 print:hidden">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Ready for client signoff & PDF presentation
              </span>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleCopy(generateMarkdownContent(state, estimate, currencySymbol, exchangeRate), 'sow')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition"
                >
                  {copiedFormat === 'sow' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Summary</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadHtml}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download HTML</span>
                </button>

                <button
                  onClick={handleExportPdf}
                  disabled={isGeneratingPdf}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 shadow-sm transition"
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
                  onClick={handlePrint}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-800 bg-slate-200 hover:bg-slate-300 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Dialog</span>
                </button>

                {leadProfile && (
                  <button
                    onClick={handleRequestArchitectReview}
                    disabled={vettingRequested}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 hover:bg-slate-200 transition"
                    title="Request an experienced Solutions Architect to formally review your scope"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>{vettingRequested ? 'Review Requested!' : 'Request Architect Vetting'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Printable Proposal Content Container */}
            <div id="printable-proposal" className="printable-document-container p-8 sm:p-12 space-y-8 bg-white text-slate-900 print:text-black print:p-0">
              
              {/* Document Letterhead */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-6 border-slate-200 gap-4">
                <div>
                  <div className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
                    Formal Statement of Work (SOW)
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                    {state.projectName || 'Software Development Project'}
                  </h1>
                  <div className="text-xs text-slate-500 mt-1 flex items-center space-x-3">
                    <span>Date: {currentDate}</span>
                    <span>•</span>
                    <span>Client: {state.clientName || 'N/A'}</span>
                    <span>•</span>
                    <span>Region Hub: {region.flag} {region.name}</span>
                  </div>
                </div>

                <div className="text-right sm:text-right">
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/80 text-xs">
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Development Labor</span>
                  <span className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
                    {currencySymbol}{convertedBaseLabor.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Contingency Buffer ({state.contingencyBufferPercent}%)</span>
                  <span className="font-bold text-sm text-amber-600 dark:text-amber-400">
                    {currencySymbol}{convertedContingency.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Maintenance Retainer</span>
                  <span className="font-bold text-sm text-blue-600 dark:text-blue-400">
                    {currencySymbol}{convertedMaintenance.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Monthly SaaS Infra</span>
                  <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    {currencySymbol}{convertedSaaSMonthly.toLocaleString()}/mo
                  </span>
                </div>
              </div>

              {/* Itemized Scope Modules Table */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <span>Itemized Technical Scope Modules ({state.selectedFeatureIds.length})</span>
                </h3>

                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                        <th className="p-3 font-semibold">Feature Module</th>
                        <th className="p-3 font-semibold">Category</th>
                        <th className="p-3 font-semibold text-right">Est. Effort</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {state.selectedFeatureIds.map((id) => {
                        const f = FEATURE_CATALOG.find((item) => item.id === id);
                        return (
                          <tr key={id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                            <td className="p-3 font-semibold text-zinc-800 dark:text-zinc-200">
                              {f?.name || id}
                              <p className="text-[10px] text-zinc-400 font-normal">{f?.description}</p>
                            </td>
                            <td className="p-3 text-zinc-500 capitalize">{f?.category.replace('_', ' ')}</td>
                            <td className="p-3 text-right font-bold text-indigo-600 dark:text-indigo-400">
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
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center space-x-2">
                  <Users className="w-4 h-4 text-purple-500" />
                  <span>Dedicated Engineering Squad</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {state.team.map((m) => {
                    const r = TEAM_ROLES.find((item) => item.id === m.roleId);
                    return (
                      <div
                        key={m.id}
                        className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-zinc-800 dark:text-zinc-200">
                            {m.count}x {r?.title || m.roleId}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            {m.experienceLevel.toUpperCase()} • {m.engagement.replace('_', ' ')}
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-700">
                          {region.flag} {region.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Milestone Payment Roadmap */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3">
                  Milestone Payment Schedule
                </h3>

                <div className="space-y-2 text-xs">
                  {estimate.phaseBreakdown.map((phase, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-zinc-800 dark:text-zinc-200">{phase.phase}</div>
                        <div className="text-[10px] text-zinc-400">{phase.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-indigo-600 dark:text-indigo-400">
                          {currencySymbol}{Math.round(phase.cost * exchangeRate).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-zinc-400">{phase.percentage}% of Base Labor</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Terms & Signoff Footer */}
              <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 space-y-2">
                <p className="font-semibold text-zinc-700 dark:text-zinc-300">
                  Terms & Acceptance Conditions:
                </p>
                <p>
                  This estimate is valid for 30 days. Final contract statement of work will include detailed sprint deliverables, code repository transfer rights, and SLA bug-fix commitments.
                </p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 pt-1 text-center">
                  &copy; {new Date().getFullYear()} Phaedra Solutions. All rights reserved. Generated with ScopeCraft.
                </p>
              </div>

            </div>
          </div>
        )}

        {/* Tab 2: CSV Spreadsheet Export */}
        {activeTab === 'csv' && (
          <div className="p-6 space-y-4 flex-1 overflow-y-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <div>
                <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
                  <Table className="w-4 h-4 text-emerald-500" />
                  <span>CSV Spreadsheet Export</span>
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Compatible with Microsoft Excel, Google Sheets, and CRM tools.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopy(csvContent, 'csv')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 transition"
                >
                  {copiedFormat === 'csv' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy CSV</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadCsv}
                  className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .CSV File</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <pre className="p-4 rounded-2xl bg-zinc-900 text-zinc-200 font-mono text-xs overflow-x-auto max-h-[50vh] leading-relaxed border border-zinc-800">
                {csvContent}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 3: Markdown Document Export */}
        {activeTab === 'markdown' && (
          <div className="p-6 space-y-4 flex-1 overflow-y-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <div>
                <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
                  <FileCode className="w-4 h-4 text-indigo-500" />
                  <span>Markdown Proposal Document</span>
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Formatted for Notion, GitHub, Slack, and developer documentation.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopy(markdownContent, 'markdown')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 transition"
                >
                  {copiedFormat === 'markdown' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Markdown</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadMarkdown}
                  className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .MD File</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <pre className="p-4 rounded-2xl bg-zinc-900 text-zinc-200 font-mono text-xs overflow-x-auto max-h-[50vh] leading-relaxed border border-zinc-800 whitespace-pre-wrap">
                {markdownContent}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 4: JSON State & Backup Import */}
        {activeTab === 'json' && (
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            
            {/* Success notification */}
            {importStatusMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{importStatusMessage}</span>
              </div>
            )}

            {/* Import JSON File Box */}
            <div className="p-5 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30 flex flex-col items-center justify-center text-center space-y-2">
              <Upload className="w-8 h-8 text-indigo-500" />
              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Restore or Import Saved Estimate JSON</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md">
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
                className="mt-2 inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload JSON File</span>
              </button>
            </div>

            {/* Export JSON Box */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
                    <FileJson className="w-4 h-4 text-amber-500" />
                    <span>Raw JSON State Backup</span>
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Backup full project state parameters for future reload or developer API usage.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCopy(jsonContent, 'json')}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 transition"
                  >
                    {copiedFormat === 'json' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownloadJson}
                    className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .JSON State</span>
                  </button>
                </div>
              </div>

              <pre className="p-4 rounded-2xl bg-zinc-900 text-amber-300/90 font-mono text-xs overflow-x-auto max-h-[35vh] leading-relaxed border border-zinc-800">
                {jsonContent}
              </pre>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
