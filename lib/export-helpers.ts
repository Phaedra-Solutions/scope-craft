import { ProjectState, EstimateResult } from '@/types/estimator';
import { FEATURE_CATALOG, TEAM_ROLES, REGIONS } from '@/lib/estimator-data';
import { calculateEffectiveMemberRate } from '@/lib/estimator-engine';

/**
 * Trigger browser file download
 */
export function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export HTML element directly as a downloadable PDF file
 */
export async function exportToPdf(elementId: string, filename: string): Promise<boolean> {
  try {
    const targetEl = document.getElementById(elementId);
    if (!targetEl) {
      console.error('PDF export target element not found:', elementId);
      return false;
    }

    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas')
    ]);

    // Capture element with html2canvas
    const canvas = await html2canvas(targetEl, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(cleanFilename);
    return true;
  } catch (err) {
    console.error('Failed to generate PDF:', err);
    return false;
  }
}

/**
 * Print HTML document cleanly by rendering into an isolated print iframe
 */
export function printHtmlReport(htmlContent: string) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const frameDoc = iframe.contentWindow?.document;
  if (frameDoc) {
    frameDoc.open();
    frameDoc.write(htmlContent);
    frameDoc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        window.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 3000);
      }
    }, 250);
  } else {
    window.print();
  }
}

/**
 * Generate CSV Spreadsheet Content
 */
export function generateCsvContent(
  state: ProjectState,
  estimate: EstimateResult,
  currencySymbol: string,
  exchangeRate: number
): string {
  const convertedGrandTotal = Math.round(estimate.grandTotalCost * exchangeRate);
  const convertedBaseLabor = Math.round(estimate.baseLaborCost * exchangeRate);
  const convertedContingency = Math.round(estimate.contingencyAmount * exchangeRate);
  const convertedProfit = Math.round(estimate.profitMarginAmount * exchangeRate);
  const convertedMaintenance = Math.round(estimate.maintenanceCost * exchangeRate);
  const convertedSaaSMonthly = Math.round(estimate.monthlySaaSCost * exchangeRate);
  const region = REGIONS.find((r) => r.id === state.regionId) || REGIONS[0];

  const rows: (string | number)[][] = [
    ['SOFTWARE COST PROPOSAL & STATEMENT OF WORK'],
    ['Project Name', state.projectName || 'Software Development Project'],
    ['Client Name', state.clientName || 'N/A'],
    ['Export Date', new Date().toLocaleDateString('en-US')],
    ['Region Benchmark', `${region.flag} ${region.name}`],
    ['Total Investment Quote', `${currencySymbol}${convertedGrandTotal.toLocaleString()}`],
    ['Estimated Timeline', `${estimate.estimatedTimelineWeeks} Weeks (~${estimate.totalHours} Hours)`],
    ['Monthly Team Burn Rate', `${currencySymbol}${Math.round(estimate.teamMonthlyBurnRate * exchangeRate).toLocaleString()}/mo`],
    ['Effective Hourly Rate', `${currencySymbol}${Math.round(estimate.effectiveHourlyRate * exchangeRate)}/hr`],
    [],
    ['EXECUTIVE COST BREAKDOWN'],
    ['Component', 'Description', 'Amount'],
    ['Base Development Labor', 'Core feature engineering', `${currencySymbol}${convertedBaseLabor.toLocaleString()}`],
    ['Contingency Buffer', `${state.contingencyBufferPercent}% risk allocation`, `${currencySymbol}${convertedContingency.toLocaleString()}`],
    ['Agency Margin / Overhead', `${state.profitMarginPercent}% management fee`, `${currencySymbol}${convertedProfit.toLocaleString()}`],
    ['Post-Launch Maintenance', `SLA Period: ${state.maintenancePeriod.replace('_', ' ')}`, `${currencySymbol}${convertedMaintenance.toLocaleString()}`],
    ['Third-Party SaaS Infra', 'Monthly recurring hosting & APIs', `${currencySymbol}${convertedSaaSMonthly.toLocaleString()}/mo`],
    [],
    ['ITEMIZED FEATURE SCOPE MODULES'],
    ['Feature Module ID', 'Module Name', 'Category', 'Est. Effort (Hours)'],
    ...state.selectedFeatureIds.map((id) => {
      const f = FEATURE_CATALOG.find((item) => item.id === id);
      return [id, f?.name || id, f?.category || 'general', `${f?.baseHours || 0} hrs` as string | number];
    }),
    [],
    ['DEDICATED ENGINEERING TEAM ROSTER'],
    ['Role ID', 'Role Title', 'Headcount', 'Experience Level', 'Engagement', 'Monthly Rate'],
    ...state.team.map((m) => {
      const r = TEAM_ROLES.find((item) => item.id === m.roleId);
      const rate = calculateEffectiveMemberRate(m.roleId, state.regionId, m.experienceLevel, m.customRate);
      let monthlyHours = 160;
      if (m.engagement === 'parttime_50') monthlyHours = 80;
      if (m.engagement === 'parttime_25') monthlyHours = 40;
      const cost = Math.round(rate * monthlyHours * m.count * exchangeRate);
      return [
        m.roleId,
        r?.title || m.roleId,
        m.count,
        m.experienceLevel.toUpperCase(),
        m.engagement,
        `${currencySymbol}${cost.toLocaleString()}/mo`
      ];
    }),
    [],
    ['MILESTONE PAYMENT SCHEDULE'],
    ['Phase', 'Description', 'Percentage', 'Cost'],
    ...estimate.phaseBreakdown.map((p) => [
      p.phase,
      p.description,
      `${p.percentage}%`,
      `${currencySymbol}${Math.round(p.cost * exchangeRate).toLocaleString()}`
    ])
  ];

  return '\uFEFF' + rows.map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
}

/**
 * Generate Markdown Document
 */
export function generateMarkdownContent(
  state: ProjectState,
  estimate: EstimateResult,
  currencySymbol: string,
  exchangeRate: number
): string {
  const convertedGrandTotal = Math.round(estimate.grandTotalCost * exchangeRate);
  const convertedBaseLabor = Math.round(estimate.baseLaborCost * exchangeRate);
  const convertedContingency = Math.round(estimate.contingencyAmount * exchangeRate);
  const convertedProfit = Math.round(estimate.profitMarginAmount * exchangeRate);
  const convertedMaintenance = Math.round(estimate.maintenanceCost * exchangeRate);
  const convertedSaaSMonthly = Math.round(estimate.monthlySaaSCost * exchangeRate);
  const region = REGIONS.find((r) => r.id === state.regionId) || REGIONS[0];
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  let md = `# Statement of Work & Project Cost Proposal\n\n`;
  md += `**Project Name:** ${state.projectName || 'Software Development Project'}\n`;
  md += `**Client Name:** ${state.clientName || 'N/A'}\n`;
  md += `**Date:** ${dateStr}\n`;
  md += `**Region Hub Benchmark:** ${region.flag} ${region.name}\n\n`;

  md += `---\n\n## 1. Executive Summary\n\n`;
  md += `| Financial Metric | Quote Value |\n`;
  md += `| :--- | :--- |\n`;
  md += `| **Total Estimated Investment** | **${currencySymbol}${convertedGrandTotal.toLocaleString()}** |\n`;
  md += `| **Estimated Timeline** | **${estimate.estimatedTimelineWeeks} Weeks** (~${estimate.totalHours} Hours) |\n`;
  md += `| **Monthly Team Burn** | **${currencySymbol}${Math.round(estimate.teamMonthlyBurnRate * exchangeRate).toLocaleString()}/mo** |\n`;
  md += `| **Effective Hourly Rate** | **${currencySymbol}${Math.round(estimate.effectiveHourlyRate * exchangeRate)}/hr** |\n\n`;

  md += `### Cost Components\n`;
  md += `- **Base Development Labor:** ${currencySymbol}${convertedBaseLabor.toLocaleString()}\n`;
  md += `- **Contingency Risk Buffer (${state.contingencyBufferPercent}%):** ${currencySymbol}${convertedContingency.toLocaleString()}\n`;
  md += `- **Agency Management Margin (${state.profitMarginPercent}%):** ${currencySymbol}${convertedProfit.toLocaleString()}\n`;
  md += `- **Post-Launch Maintenance SLA (${state.maintenancePeriod.replace('_', ' ')}):** ${currencySymbol}${convertedMaintenance.toLocaleString()}\n`;
  md += `- **Estimated SaaS & Infrastructure:** ${currencySymbol}${convertedSaaSMonthly.toLocaleString()}/mo\n\n`;

  md += `---\n\n## 2. Itemized Technical Scope Modules (${state.selectedFeatureIds.length})\n\n`;
  md += `| Feature Module | Category | Est. Dev Hours |\n`;
  md += `| :--- | :--- | :--- |\n`;
  state.selectedFeatureIds.forEach((id) => {
    const f = FEATURE_CATALOG.find((item) => item.id === id);
    md += `| **${f?.name || id}**<br>${f?.description || ''} | ${f?.category.replace('_', ' ') || ''} | ${f?.baseHours || 0} hrs |\n`;
  });
  md += `\n`;

  md += `---\n\n## 3. Dedicated Engineering Squad Roster\n\n`;
  md += `| Role | Headcount | Experience Tier | Engagement | Monthly Cost |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- |\n`;
  state.team.forEach((m) => {
    const r = TEAM_ROLES.find((item) => item.id === m.roleId);
    const rate = calculateEffectiveMemberRate(m.roleId, state.regionId, m.experienceLevel, m.customRate);
    let monthlyHours = 160;
    if (m.engagement === 'parttime_50') monthlyHours = 80;
    if (m.engagement === 'parttime_25') monthlyHours = 40;
    const cost = Math.round(rate * monthlyHours * m.count * exchangeRate);
    md += `| **${r?.title || m.roleId}** | ${m.count}x | ${m.experienceLevel.toUpperCase()} | ${m.engagement.replace('_', ' ')} | ${currencySymbol}${cost.toLocaleString()}/mo |\n`;
  });
  md += `\n`;

  md += `---\n\n## 4. Milestone Payment Roadmap\n\n`;
  md += `| Milestone Phase | Description | Allocation | Amount |\n`;
  md += `| :--- | :--- | :--- | :--- |\n`;
  estimate.phaseBreakdown.forEach((p) => {
    md += `| **${p.phase}** | ${p.description} | ${p.percentage}% | ${currencySymbol}${Math.round(p.cost * exchangeRate).toLocaleString()} |\n`;
  });
  md += `\n`;

  md += `---\n\n## 5. Terms & Authorization\n\n`;
  md += `This cost proposal is valid for 30 days from issuance. Standard warranty covers bug fixes for 30 days post-launch.\n\n`;
  md += `*© ${new Date().getFullYear()} Phaedra Solutions. All rights reserved. Generated by ScopeCraft.*\n\n`;

  return md;
}

/**
 * Generate Standalone HTML Document
 */
export function generateHtmlReport(
  state: ProjectState,
  estimate: EstimateResult,
  currencySymbol: string,
  exchangeRate: number
): string {
  const convertedGrandTotal = Math.round(estimate.grandTotalCost * exchangeRate);
  const convertedBaseLabor = Math.round(estimate.baseLaborCost * exchangeRate);
  const convertedContingency = Math.round(estimate.contingencyAmount * exchangeRate);
  const convertedProfit = Math.round(estimate.profitMarginAmount * exchangeRate);
  const convertedMaintenance = Math.round(estimate.maintenanceCost * exchangeRate);
  const convertedSaaSMonthly = Math.round(estimate.monthlySaaSCost * exchangeRate);
  const region = REGIONS.find((r) => r.id === state.regionId) || REGIONS[0];
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Statement of Work - ${state.projectName || 'Software Proposal'}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #f9fafb;
      margin: 0;
      padding: 40px;
    }
    .container {
      max-width: 860px;
      margin: 0 auto;
      background: #ffffff;
      padding: 48px;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border: 1px solid #e5e7eb;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #6366f1;
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    .title {
      font-size: 28px;
      font-weight: 800;
      color: #111827;
      margin: 0 0 8px 0;
    }
    .subtitle {
      font-size: 13px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 700;
    }
    .quote-badge {
      text-align: right;
    }
    .quote-price {
      font-size: 32px;
      font-weight: 900;
      color: #4f46e5;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      background: #f3f4f6;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 32px;
    }
    .grid-item label {
      display: block;
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
      font-weight: 600;
    }
    .grid-item span {
      font-size: 16px;
      font-weight: 700;
      color: #1f2937;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 32px;
      font-size: 13px;
    }
    th {
      background: #f3f4f6;
      text-align: left;
      padding: 10px 12px;
      font-weight: 700;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #e5e7eb;
      color: #1f2937;
    }
    .section-title {
      font-size: 16px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #4b5563;
      margin-bottom: 12px;
    }
    .no-print {
      margin-bottom: 24px;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }
    button {
      background: #4f46e5;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; border: none; padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="no-print">
      <button onclick="window.print()">Print or Save PDF</button>
    </div>

    <div class="header">
      <div>
        <div class="subtitle">Statement of Work (SOW)</div>
        <h1 class="title">${state.projectName || 'Software Project'}</h1>
        <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
          Date: ${currentDate} • Client: ${state.clientName || 'N/A'} • Region: ${region.flag} ${region.name}
        </div>
      </div>
      <div class="quote-badge">
        <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: bold;">Total Investment Quote</div>
        <div class="quote-price">${currencySymbol}${convertedGrandTotal.toLocaleString()}</div>
        <div style="font-size: 12px; color: #6b7280;">${estimate.estimatedTimelineWeeks} Weeks (${estimate.totalHours} Hours)</div>
      </div>
    </div>

    <div class="grid">
      <div class="grid-item">
        <label>Base Labor</label>
        <span>${currencySymbol}${convertedBaseLabor.toLocaleString()}</span>
      </div>
      <div class="grid-item">
        <label>Contingency (${state.contingencyBufferPercent}%)</label>
        <span>${currencySymbol}${convertedContingency.toLocaleString()}</span>
      </div>
      <div class="grid-item">
        <label>SLA Maintenance</label>
        <span>${currencySymbol}${convertedMaintenance.toLocaleString()}</span>
      </div>
      <div class="grid-item">
        <label>Monthly SaaS</label>
        <span>${currencySymbol}${convertedSaaSMonthly.toLocaleString()}/mo</span>
      </div>
    </div>

    <div class="section-title">Itemized Technical Scope Modules</div>
    <table>
      <thead>
        <tr>
          <th>Feature Module</th>
          <th>Category</th>
          <th style="text-align: right;">Est. Effort</th>
        </tr>
      </thead>
      <tbody>
        ${state.selectedFeatureIds.map((id) => {
          const f = FEATURE_CATALOG.find((item) => item.id === id);
          return `<tr>
            <td><strong>${f?.name || id}</strong><br><small style="color: #6b7280;">${f?.description || ''}</small></td>
            <td style="text-transform: capitalize;">${f?.category.replace('_', ' ') || ''}</td>
            <td style="text-align: right; font-weight: bold;">${f?.baseHours || 0} hrs</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>

    <div class="section-title">Dedicated Engineering Squad</div>
    <table>
      <thead>
        <tr>
          <th>Role Title</th>
          <th>Headcount</th>
          <th>Experience</th>
          <th>Engagement</th>
        </tr>
      </thead>
      <tbody>
        ${state.team.map((m) => {
          const r = TEAM_ROLES.find((item) => item.id === m.roleId);
          return `<tr>
            <td><strong>${r?.title || m.roleId}</strong></td>
            <td>${m.count}x</td>
            <td style="text-transform: uppercase;">${m.experienceLevel}</td>
            <td>${m.engagement.replace('_', ' ')}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>

    <div class="section-title">Milestone Payment Roadmap</div>
    <table>
      <thead>
        <tr>
          <th>Milestone Phase</th>
          <th>Description</th>
          <th>Allocation</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${estimate.phaseBreakdown.map((p) => `<tr>
          <td><strong>${p.phase}</strong></td>
          <td>${p.description}</td>
          <td>${p.percentage}%</td>
          <td style="text-align: right; font-weight: bold;">${currencySymbol}${Math.round(p.cost * exchangeRate).toLocaleString()}</td>
        </tr>`).join('')}
      </tbody>
    </table>

    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 11px; color: #6b7280; line-height: 1.5;">
      <strong>Terms & Acceptance Conditions:</strong><br>
      This cost proposal is valid for 30 days from issuance. Final statement of work will include detailed sprint deliverables, repository transfer rights, and SLA bug-fix commitments.
      <div style="margin-top: 16px; padding-top: 12px; border-top: 1px dashed #e5e7eb; font-size: 10px; color: #9ca3af; text-align: center;">
        &copy; ${new Date().getFullYear()} Phaedra Solutions. All rights reserved. Generated with ScopeCraft.
      </div>
    </div>
  </div>
</body>
</html>`;
}
