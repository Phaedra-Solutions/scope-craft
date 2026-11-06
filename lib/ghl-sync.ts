import { LeadProfile, ProjectState, EstimateResult } from '@/types/estimator';
import { FEATURE_CATALOG, TEAM_ROLES, REGIONS } from '@/lib/estimator-data';

export async function sendLeadToGHL(
  leadProfile: LeadProfile,
  projectState: ProjectState,
  estimate: EstimateResult,
  eventType: 'lead_created' | 'scope_updated' = 'lead_created',
  triggerAction?: string
): Promise<{ success: boolean; forwardedToGHL?: boolean; mockMode?: boolean }> {
  try {
    const region = REGIONS.find((r) => r.id === projectState.regionId) || REGIONS[0];

    // Gather selected feature names
    const selectedFeatureNames = projectState.selectedFeatureIds.map((id) => {
      const feat = FEATURE_CATALOG.find((f) => f.id === id);
      return feat ? `${feat.name} (${feat.category.replace('_', ' ')})` : id;
    });

    // Gather team breakdown
    const teamComposition = projectState.team.map((m) => {
      const r = TEAM_ROLES.find((role) => role.id === m.roleId);
      return {
        roleTitle: r?.title || m.roleId,
        count: m.count,
        level: m.experienceLevel.toUpperCase()
      };
    });

    const payload = {
      eventType,
      triggerAction: triggerAction || (eventType === 'lead_created' ? 'guided_wizard_reveal' : 'scope_export'),
      leadProfile,
      scopeSnapshot: {
        projectName: projectState.projectName,
        clientName: projectState.clientName || leadProfile.company || leadProfile.fullName,
        estimatedGrandTotal: estimate.grandTotalCost,
        currency: 'USD',
        estimatedTimelineWeeks: estimate.estimatedTimelineWeeks,
        estimatedTotalHours: estimate.totalHours,
        monthlyTeamBurn: estimate.teamMonthlyBurnRate,
        complexity: projectState.complexity,
        designLevel: projectState.designLevel,
        qaLevel: projectState.qaLevel,
        platforms: projectState.platforms,
        regionId: projectState.regionId,
        regionName: `${region.flag} ${region.name}`,
        selectedFeatureNames,
        teamComposition,
        saasAddons: projectState.selectedSaaSAddons
      }
    };

    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.warn('[GHL Client Sync] Lead submission responded with error status:', res.status);
      return { success: false };
    }

    const data = await res.json();
    return {
      success: true,
      forwardedToGHL: data.forwardedToGHL,
      mockMode: data.mockMode
    };
  } catch (err) {
    console.error('[GHL Client Sync] Failed to send lead to GHL proxy:', err);
    return { success: false };
  }
}
