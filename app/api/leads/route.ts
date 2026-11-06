import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface LeadPayload {
  eventType?: 'lead_created' | 'scope_updated';
  triggerAction?: string;
  leadProfile: {
    fullName: string;
    email: string;
    phone: string;
    company: string;
    role: string;
    budgetRange: string;
    marketingConsent?: boolean;
    privacyAccepted?: boolean;
    submittedAt?: string;
    wantsOptionalPaidReview?: boolean;
  };
  scopeSnapshot?: {
    projectName?: string;
    clientName?: string;
    estimatedGrandTotal?: number;
    currency?: string;
    estimatedTimelineWeeks?: number;
    estimatedTotalHours?: number;
    monthlyTeamBurn?: number;
    complexity?: string;
    designLevel?: string;
    qaLevel?: string;
    platforms?: string[];
    regionId?: string;
    regionName?: string;
    selectedFeatureNames?: string[];
    teamComposition?: { roleTitle: string; count: number; level: string }[];
    saasAddons?: string[];
    formattedScopeNote?: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as LeadPayload;
    const { eventType = 'lead_created', leadProfile, scopeSnapshot, triggerAction } = body;

    if (!leadProfile || !leadProfile.email || !leadProfile.fullName) {
      return NextResponse.json(
        { error: 'Invalid lead profile. Full name and email are required.' },
        { status: 400 }
      );
    }

    // Split Name into First and Last for standard CRM contact mapping
    const nameParts = leadProfile.fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || firstName;

    // Build automated tags array
    const tags: string[] = ['phaedra-estimator-lead', 'complimentary-scope', 'website-inbound'];
    if (triggerAction === 'export_sow' || triggerAction === 'download_pdf') {
      tags.push('phaedra-scope-exported');
    }
    if (triggerAction === 'request_architect_review' || leadProfile.wantsOptionalPaidReview) {
      tags.push('phaedra-architect-vetting-requested');
    }

    // Format human-readable Scope Breakdown Note for GoHighLevel Activity Note
    let scopeNote = scopeSnapshot?.formattedScopeNote || '';
    if (!scopeNote && scopeSnapshot) {
      scopeNote = `PHAEDRA SOLUTIONS ESTIMATOR SCOPE SUMMARY:\n` +
        `• Project: ${scopeSnapshot.projectName || 'Software Development Project'}\n` +
        `• Client: ${leadProfile.company || leadProfile.fullName}\n` +
        `• Total Investment Quote: ${scopeSnapshot.currency || '$'}${scopeSnapshot.estimatedGrandTotal?.toLocaleString() || 'N/A'}\n` +
        `• Timeline: ${scopeSnapshot.estimatedTimelineWeeks || 'N/A'} Weeks (~${scopeSnapshot.estimatedTotalHours || 0} Hours)\n` +
        `• Monthly Team Burn: ${scopeSnapshot.currency || '$'}${scopeSnapshot.monthlyTeamBurn?.toLocaleString() || 'N/A'}/mo\n` +
        `• Location Benchmark: ${scopeSnapshot.regionName || 'Phaedra Solutions (default) (30%)'}\n` +
        `• Target Platforms: ${(scopeSnapshot.platforms || []).join(', ') || 'Web'}\n` +
        `• Technical Complexity: ${scopeSnapshot.complexity?.toUpperCase() || 'STANDARD'}\n` +
        `• Design Tier: ${scopeSnapshot.designLevel || 'Standard UI'} | QA Tier: ${scopeSnapshot.qaLevel || 'Standard'}\n` +
        `• Selected Modules (${scopeSnapshot.selectedFeatureNames?.length || 0}):\n  - ${(scopeSnapshot.selectedFeatureNames || []).join('\n  - ')}\n` +
        `• Team Composition:\n  - ${(scopeSnapshot.teamComposition || []).map((m) => `${m.count}x ${m.roleTitle} (${m.level})`).join('\n  - ')}\n` +
        `• Included Cloud SaaS: ${(scopeSnapshot.saasAddons || []).join(', ') || 'Standard AWS/GCP'}\n` +
        `• Optional Paid Architect Review Requested: ${leadProfile.wantsOptionalPaidReview ? 'YES (High Priority)' : 'No (Complimentary Estimator)'}`;
    }

    // Standardized GoHighLevel Inbound Webhook Payload
    const ghlPayload = {
      source: 'Phaedra Solutions Software Estimator',
      eventType,
      triggerAction: triggerAction || 'wizard_lead_submission',
      submittedAt: leadProfile.submittedAt || new Date().toISOString(),
      contact: {
        firstName,
        lastName,
        name: leadProfile.fullName,
        email: leadProfile.email,
        phone: leadProfile.phone || '',
        companyName: leadProfile.company || '',
        address1: '',
        city: '',
        country: ''
      },
      customFields: {
        job_role: leadProfile.role || 'Unspecified',
        budget_range: leadProfile.budgetRange || 'Unspecified',
        initial_project_name: scopeSnapshot?.projectName || 'Software Development Project',
        estimated_grand_total: scopeSnapshot?.estimatedGrandTotal || 0,
        currency: scopeSnapshot?.currency || 'USD',
        estimated_timeline_weeks: scopeSnapshot?.estimatedTimelineWeeks || 0,
        estimated_total_hours: scopeSnapshot?.estimatedTotalHours || 0,
        monthly_team_burn: scopeSnapshot?.monthlyTeamBurn || 0,
        selected_platforms: (scopeSnapshot?.platforms || []).join(', '),
        region_benchmark: scopeSnapshot?.regionName || 'Phaedra Solutions (default) (30%)',
        wants_paid_architect_review: Boolean(leadProfile.wantsOptionalPaidReview),
        marketing_consent: Boolean(leadProfile.marketingConsent),
        privacy_policy_accepted: Boolean(leadProfile.privacyAccepted)
      },
      tags,
      note: scopeNote
    };

    const webhookUrl = process.env.GHL_WEBHOOK_URL;
    let forwardedToGHL = false;

    if (webhookUrl && !webhookUrl.includes('YOUR_GHL_INBOUND_WEBHOOK_URL')) {
      try {
        const ghlResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Phaedra-Estimator-Hook/1.0'
          },
          body: JSON.stringify(ghlPayload)
        });

        if (ghlResponse.ok) {
          forwardedToGHL = true;
          console.log('[GHL Sync] Successfully posted lead to GoHighLevel webhook:', leadProfile.email);
        } else {
          console.warn('[GHL Sync] Webhook returned non-200 status:', ghlResponse.status, await ghlResponse.text().catch(() => ''));
        }
      } catch (err) {
        console.error('[GHL Sync] Network error while forwarding to GoHighLevel:', err);
      }
    } else {
      console.log('[GHL Sync] GHL_WEBHOOK_URL is not configured. Logging payload server-side (Mock Mode):', {
        email: leadProfile.email,
        name: leadProfile.fullName,
        company: leadProfile.company,
        budget: leadProfile.budgetRange,
        grandTotal: scopeSnapshot?.estimatedGrandTotal
      });
    }

    return NextResponse.json({
      success: true,
      forwardedToGHL,
      mockMode: !webhookUrl || webhookUrl.includes('YOUR_GHL_INBOUND_WEBHOOK_URL'),
      message: 'Lead and project scope captured successfully.'
    });
  } catch (error) {
    console.error('[GHL Sync] Internal server error processing lead:', error);
    return NextResponse.json(
      { error: 'Failed to process lead capture data.' },
      { status: 500 }
    );
  }
}
