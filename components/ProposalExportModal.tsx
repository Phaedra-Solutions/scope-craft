'use client';

import React, { useState } from 'react';
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
  Sparkles,
  Layers,
  Users,
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
  leadProfile?: LeadProfile | null;
}

export const ProposalExportModal: React.FC<ProposalExportModalProps> = ({
  isOpen,
  onClose,
  state,
  estimate,
  currencySymbol,
  exchangeRate,
  leadProfile
}) => {
  const [activeTab, setActiveTab] = useState<ExportTab>('sow');
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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

  const csvContent = generateCsvContent(state, estimate, currencySymbol, exchangeRate);
  const markdownContent = generateMarkdownContent(state, estimate, currencySymbol, exchangeRate);
  const jsonContent = JSON.stringify({ version: '1.0', exportedAt: new Date().toISOString(), projectState: state }, null, 2);

  return (
    <div className="fixed inset-0 z-50 bg-[#082A1C]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-[#DDE3E7] rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl my-8 flex flex-col print-container-root">
        {/* Action Header Bar (Hidden in Print) */}
        <div className="p-4 sm:p-5 border-b border-[#DDE3E7] flex flex-col sm:flex-row sm:items-center justify-between bg-[#F4F7F9] gap-3 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-[#082A1C] text-[#CDFF8C]">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-[#082A1C] block lb-heading">
                Export & Share Cost Proposal
              </span>
              <p className="text-[11px] text-[#64707A]">
                Generate formal Statement of Work (SOW), CSV spreadsheets, or Markdown docs
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#64707A] hover:text-[#082A1C] transition-all duration-200 active:scale-[0.98] rounded-lg hover:bg-[#DDE3E7]/60"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation (Rule 1 Flat Minimalism, Hidden in Print) */}
        <div className="px-6 pt-2 bg-[#F4F7F9] border-b border-[#DDE3E7] flex items-center space-x-4 overflow-x-auto print:hidden no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('sow')}
            className={`flex items-center space-x-2 px-2 py-2.5 text-xs font-semibold border-b-2 transition-all duration-200 active:scale-[0.98] whitespace-nowrap ${
              activeTab === 'sow'
                ? 'border-[#082A1C] text-[#082A1C]'
                : 'border-transparent text-[#64707A] hover:text-[#082A1C]'
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
                ? 'border-[#082A1C] text-[#082A1C]'
                : 'border-transparent text-[#64707A] hover:text-[#082A1C]'
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
                ? 'border-[#082A1C] text-[#082A1C]'
                : 'border-transparent text-[#64707A] hover:text-[#082A1C]'
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
                ? 'border-[#082A1C] text-[#082A1C]'
                : 'border-transparent text-[#64707A] hover:text-[#082A1C]'
            }`}
          >
            <FileJson className="w-4 h-4" />
            <span>JSON Export</span>
          </button>
        </div>

        {/* Tab 1: Printable SOW Proposal Document */}
        {activeTab === 'sow' && (
          <div className="flex-1 overflow-y-auto">
            {/* Action Bar */}
            <div className="p-4 bg-white border-b border-[#DDE3E7] flex flex-wrap items-center justify-between gap-2 print:hidden">
              <span className="text-xs text-[#64707A] font-medium">
                Ready for client signoff & PDF presentation
              </span>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(generateMarkdownContent(state, estimate, currencySymbol, exchangeRate), 'sow')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#082A1C] bg-[#F4F7F9] border border-[#DDE3E7] hover:border-[#082A1C]/40 transition-all duration-200 active:scale-[0.98]"
                >
                  {copiedFormat === 'sow' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#144731]" />
                      <span className="text-[#144731]">Copied!</span>
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
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#082A1C] bg-[#F4F7F9] border border-[#DDE3E7] hover:border-[#082A1C]/40 transition-all duration-200 active:scale-[0.98]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download HTML</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isGeneratingPdf}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold lb-btn-primary disabled:opacity-50 shadow-sm active:scale-[0.98]"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 animate-spin text-[#CDFF8C]" />
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
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#082A1C] bg-[#F4F7F9] border border-[#DDE3E7] hover:bg-[#DDE3E7]/50 transition-all duration-200 active:scale-[0.98]"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Dialog</span>
                </button>
              </div>
            </div>

            {/* Printable Proposal Paper Sheet (Crisp White for Client-Ready PDF Export) */}
            <div className="bg-[#F4F7F9] p-4 sm:p-6 print:p-0 print:bg-white">
              <div id="printable-proposal" className="printable-document-container p-8 sm:p-12 space-y-8 bg-white text-[#082A1C] rounded-xl border border-[#DDE3E7] shadow-sm print:shadow-none print:border-none print:rounded-none print:text-black print:p-0">
                {/* Document Letterhead */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-6 border-[#DDE3E7] gap-4">
                  <div>
                    <div className="text-xs font-mono font-bold text-[#144731] uppercase tracking-widest mb-1">
                      Formal Statement of Work (SOW)
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-[#082A1C] lb-heading">
                      {state.projectName || 'Software Development Project'}
                    </h1>
                    <div className="text-xs text-[#64707A] mt-1 flex flex-wrap items-center gap-2">
                      <span>Date: {currentDate}</span>
                      <span>•</span>
                      <span>Client: {state.clientName || 'N/A'}</span>
                      <span>•</span>
                      <span>Region Hub: {region.flag} {region.name}</span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] uppercase font-bold text-[#64707A] block">Total Investment Quote</span>
                    <span className="text-3xl font-black text-[#082A1C] tabular-nums">
                      {currencySymbol}{convertedGrandTotal.toLocaleString()}
                    </span>
                    <span className="text-[11px] font-mono text-[#64707A] block tabular-nums">
                      {estimate.estimatedTimelineWeeks} Weeks (~{estimate.totalHours} hrs)
                    </span>
                  </div>
                </div>

                {/* Executive Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#F4F7F9] border border-[#DDE3E7] text-xs">
                  <div>
                    <span className="text-[#64707A] block text-[10px] uppercase font-semibold">Development Labor</span>
                    <span className="font-mono font-bold text-sm text-[#082A1C] tabular-nums">
                      {currencySymbol}{convertedBaseLabor.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64707A] block text-[10px] uppercase font-semibold">Contingency Buffer ({state.contingencyBufferPercent}%)</span>
                    <span className="font-mono font-bold text-sm text-[#B45309] tabular-nums">
                      {currencySymbol}{convertedContingency.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64707A] block text-[10px] uppercase font-semibold">Maintenance Retainer</span>
                    <span className="font-mono font-bold text-sm text-[#082A1C] tabular-nums">
                      {currencySymbol}{convertedMaintenance.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64707A] block text-[10px] uppercase font-semibold">Monthly SaaS Infra</span>
                    <span className="font-mono font-bold text-sm text-[#144731] tabular-nums">
                      {currencySymbol}{convertedSaaSMonthly.toLocaleString()}/mo
                    </span>
                  </div>
                </div>

                {/* Itemized Scope Modules Table */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#64707A] mb-3 flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-[#082A1C]" />
                    <span>Itemized Technical Scope Modules ({state.selectedFeatureIds.length})</span>
                  </h3>

                  <div className="border border-[#DDE3E7] rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#F4F7F9] text-[#082A1C] border-b border-[#DDE3E7]">
                          <th className="p-3 font-semibold">Feature Module</th>
                          <th className="p-3 font-semibold">Category</th>
                          <th className="p-3 font-semibold text-right">Est. Effort</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DDE3E7]">
                        {state.selectedFeatureIds.map((id) => {
                          const f = FEATURE_CATALOG.find((item) => item.id === id);
                          return (
                            <tr key={id}>
                              <td className="p-3 font-semibold text-[#082A1C]">
                                {f?.name || id}
                                <p className="text-[10px] text-[#64707A] font-normal">{f?.description}</p>
                              </td>
                              <td className="p-3 text-[#64707A] capitalize">{f?.category.replace('_', ' ')}</td>
                              <td className="p-3 text-right font-mono font-bold text-[#082A1C] tabular-nums">
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
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#64707A] mb-3 flex items-center space-x-2">
                    <Users className="w-4 h-4 text-[#082A1C]" />
                    <span>Dedicated Engineering Squad</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {state.team.map((m) => {
                      const r = TEAM_ROLES.find((item) => item.id === m.roleId);
                      return (
                        <div
                          key={m.id}
                          className="p-3 rounded-xl border border-[#DDE3E7] bg-[#F4F7F9] flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-[#082A1C]">
                              {m.count}x {r?.title || m.roleId}
                            </div>
                            <div className="text-[10px] text-[#64707A]">
                              {m.experienceLevel.toUpperCase()} • {m.engagement.replace('_', ' ')}
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-1 rounded bg-white border border-[#DDE3E7] text-[#082A1C]">
                            {region.flag} {region.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Milestone Payment Roadmap */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#64707A] mb-3">
                    Milestone Payment Schedule
                  </h3>

                  <div className="space-y-2 text-xs">
                    {estimate.phaseBreakdown.map((phase, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-[#DDE3E7] flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-[#082A1C]">{phase.phase}</div>
                          <div className="text-[10px] text-[#64707A]">{phase.description}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-[#082A1C] tabular-nums">
                            {currencySymbol}{Math.round(phase.cost * exchangeRate).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-[#64707A] tabular-nums">{phase.percentage}% of Base Labor</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Terms & Signoff Footer */}
                <div className="pt-6 border-t border-[#DDE3E7] text-[11px] text-[#64707A] space-y-2">
                  <p className="font-semibold text-[#082A1C]">
                    Terms & Acceptance Conditions:
                  </p>
                  <p>
                    This estimate is valid for 30 days. Final contract statement of work will include detailed sprint deliverables, code repository transfer rights, and SLA bug-fix commitments.
                  </p>
                  <p className="text-[10px] text-[#64707A] pt-1 text-center">
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F4F7F9] p-4 rounded-2xl border border-[#DDE3E7]">
              <div>
                <h4 className="font-bold text-sm text-[#082A1C] flex items-center space-x-2">
                  <Table className="w-4 h-4 text-[#082A1C]" />
                  <span>CSV Spreadsheet Export</span>
                </h4>
                <p className="text-xs text-[#64707A] mt-0.5">
                  Compatible with Microsoft Excel, Google Sheets, and CRM tools.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleCopy(csvContent, 'csv')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#082A1C] bg-white border border-[#DDE3E7] hover:border-[#082A1C]/40 transition-all duration-200 active:scale-[0.98]"
                >
                  {copiedFormat === 'csv' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#144731]" />
                      <span className="text-[#144731]">Copied!</span>
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
                  className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-bold lb-btn-primary shadow-sm active:scale-[0.98]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .CSV File</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <pre className="p-4 rounded-2xl bg-[#082A1C] text-white/95 font-mono text-xs overflow-x-auto max-h-[50vh] leading-relaxed border border-[#1E4F3A]">
                {csvContent}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 3: Markdown Document Export */}
        {activeTab === 'markdown' && (
          <div className="p-6 space-y-4 flex-1 overflow-y-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F4F7F9] p-4 rounded-2xl border border-[#DDE3E7]">
              <div>
                <h4 className="font-bold text-sm text-[#082A1C] flex items-center space-x-2">
                  <FileCode className="w-4 h-4 text-[#082A1C]" />
                  <span>Markdown Proposal Document</span>
                </h4>
                <p className="text-xs text-[#64707A] mt-0.5">
                  Formatted for Notion, GitHub, Slack, and developer documentation.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleCopy(markdownContent, 'markdown')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#082A1C] bg-white border border-[#DDE3E7] hover:border-[#082A1C]/40 transition-all duration-200 active:scale-[0.98]"
                >
                  {copiedFormat === 'markdown' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#144731]" />
                      <span className="text-[#144731]">Copied!</span>
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
                  className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-bold lb-btn-primary shadow-sm active:scale-[0.98]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .MD File</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <pre className="p-4 rounded-2xl bg-[#082A1C] text-white/95 font-mono text-xs overflow-x-auto max-h-[50vh] leading-relaxed border border-[#1E4F3A] whitespace-pre-wrap">
                {markdownContent}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 4: JSON State Backup */}
        {activeTab === 'json' && (
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F4F7F9] p-4 rounded-2xl border border-[#DDE3E7]">
                <div>
                  <h4 className="font-bold text-sm text-[#082A1C] flex items-center space-x-2">
                    <FileJson className="w-4 h-4 text-[#082A1C]" />
                    <span>Raw JSON State Backup</span>
                  </h4>
                  <p className="text-xs text-[#64707A] mt-0.5">
                    Backup full project state parameters for future reload or developer API usage.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(jsonContent, 'json')}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#082A1C] bg-white border border-[#DDE3E7] hover:border-[#082A1C]/40 transition-all duration-200 active:scale-[0.98]"
                  >
                    {copiedFormat === 'json' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#144731]" />
                        <span className="text-[#144731]">Copied!</span>
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
                    className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-bold lb-btn-primary shadow-sm active:scale-[0.98]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .JSON State</span>
                  </button>
                </div>
              </div>

              <pre className="p-4 rounded-2xl bg-[#082A1C] text-[#CDFF8C] font-mono text-xs overflow-x-auto max-h-[35vh] leading-relaxed border border-[#1E4F3A]">
                {jsonContent}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
