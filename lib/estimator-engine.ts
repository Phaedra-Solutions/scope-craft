import {
  ProjectState,
  EstimateResult,
  TeamMemberConfig,
  RoleCategory,
  ComplexityLevel
} from '@/types/estimator';
import {
  FEATURE_CATALOG,
  TEAM_ROLES,
  REGIONS,
  EXPERIENCE_MULTIPLIERS,
  SAAS_ADDONS
} from './estimator-data';

export function calculateEffectiveMemberRate(
  roleId: string,
  regionId: string,
  experienceLevel: TeamMemberConfig['experienceLevel'],
  customRate?: number
): number {
  if (customRate !== undefined && customRate > 0) {
    return customRate;
  }

  const role = TEAM_ROLES.find((r) => r.id === roleId);
  const baseRate = role ? role.defaultHourlyRate : 85;

  let normalizedRegionId = regionId;
  if (regionId === 'western_europe' || regionId === 'eastern_europe') {
    normalizedRegionId = 'europe';
  } else if (regionId === 'sea') {
    normalizedRegionId = 'south_east';
  } else if (regionId === 'latam' || regionId === 'south_asia') {
    normalizedRegionId = 'phaedra';
  }

  const region = REGIONS.find((r) => r.id === normalizedRegionId) || REGIONS.find((r) => r.id === 'phaedra') || REGIONS[0];
  const regionMultiplier = region ? region.rateMultiplier : 0.30;

  const expConfig = EXPERIENCE_MULTIPLIERS[experienceLevel] || EXPERIENCE_MULTIPLIERS.senior;

  return Math.round(baseRate * regionMultiplier * expConfig.rateMultiplier);
}

export function generateRecommendedTeam(
  selectedFeatureIds: string[],
  platforms: ProjectState['platforms'],
  complexity: ComplexityLevel,
  designLevel: ProjectState['designLevel']
): TeamMemberConfig[] {
  const hasMobile = platforms.includes('ios') || platforms.includes('android') || platforms.includes('cross_platform');
  const hasWeb = platforms.includes('web') || platforms.includes('desktop');

  const team: TeamMemberConfig[] = [];

  // Tech Lead / Solution Architect
  team.push({
    id: 'rec_tech_lead',
    roleId: 'tech_lead',
    count: 1,
    experienceLevel: 'lead',
    engagement: complexity === 'enterprise' ? 'fulltime' : 'parttime_50'
  });

  // UI/UX Designer
  team.push({
    id: 'rec_designer',
    roleId: 'ui_ux_designer',
    count: designLevel === 'custom_bespoke' ? 2 : 1,
    experienceLevel: 'senior',
    engagement: 'fulltime'
  });

  // Frontend / Web Dev
  if (hasWeb || (!hasMobile && platforms.length === 0)) {
    const feCount = complexity === 'enterprise' ? 2 : 1;
    team.push({
      id: 'rec_frontend',
      roleId: 'frontend_dev',
      count: feCount,
      experienceLevel: 'senior',
      engagement: 'fulltime'
    });
  }

  // Mobile Dev
  if (hasMobile) {
    const mobCount = platforms.includes('ios') && platforms.includes('android') && !platforms.includes('cross_platform') ? 2 : 1;
    team.push({
      id: 'rec_mobile',
      roleId: 'mobile_dev',
      count: mobCount,
      experienceLevel: 'senior',
      engagement: 'fulltime'
    });
  }

  // Backend Dev
  const hasAiOrComplexBackend = selectedFeatureIds.some((id) =>
    ['ai_llm_chat', 'ai_rag_vectors', 'pay_marketplace', 'sec_compliance', 'chat_realtime', 'search_elastic'].includes(id)
  );

  const beCount = complexity === 'enterprise' || hasAiOrComplexBackend ? 2 : 1;
  team.push({
    id: 'rec_backend',
    roleId: 'backend_dev',
    count: beCount,
    experienceLevel: 'senior',
    engagement: 'fulltime'
  });

  // QA Engineer
  team.push({
    id: 'rec_qa',
    roleId: 'qa_engineer',
    count: 1,
    experienceLevel: 'mid',
    engagement: 'fulltime'
  });

  // DevOps
  if (complexity === 'enterprise' || selectedFeatureIds.includes('sec_compliance')) {
    team.push({
      id: 'rec_devops',
      roleId: 'devops_cloud',
      count: 1,
      experienceLevel: 'senior',
      engagement: 'parttime_50'
    });
  } else {
    team.push({
      id: 'rec_devops',
      roleId: 'devops_cloud',
      count: 1,
      experienceLevel: 'mid',
      engagement: 'parttime_25'
    });
  }

  // Product Manager
  team.push({
    id: 'rec_pm',
    roleId: 'product_manager',
    count: 1,
    experienceLevel: 'mid',
    engagement: 'parttime_50'
  });

  return team;
}

export function calculateEstimate(state: ProjectState): EstimateResult {
  // 1. Calculate Base Feature Hours
  const selectedFeatures = FEATURE_CATALOG.filter((f) => state.selectedFeatureIds.includes(f.id));
  let baseFeatureHours = selectedFeatures.reduce((sum, f) => sum + f.baseHours, 0);
  if (baseFeatureHours === 0) {
    baseFeatureHours = 120; // Default minimum baseline MVP frame
  }

  // 2. Platform Multipliers
  let platformMult = 1.0;
  const pCount = state.platforms.length;
  if (state.platforms.includes('cross_platform')) {
    platformMult = 1.35;
  } else if (pCount === 2) {
    platformMult = 1.45;
  } else if (pCount >= 3) {
    platformMult = 1.8;
  }

  // 3. Complexity Multiplier
  let complexityMult = 1.0;
  if (state.complexity === 'mvp') complexityMult = 0.9;
  if (state.complexity === 'standard') complexityMult = 1.18;
  if (state.complexity === 'enterprise') complexityMult = 1.55;

  // 4. Design Level Overhead
  let designAddPercent = 0.15;
  if (state.designLevel === 'wireframe') designAddPercent = 0.08;
  if (state.designLevel === 'standard_ui') designAddPercent = 0.18;
  if (state.designLevel === 'custom_bespoke') designAddPercent = 0.30;

  // 5. QA & Security Overhead
  let qaAddPercent = 0.12;
  if (state.qaLevel === 'basic') qaAddPercent = 0.08;
  if (state.qaLevel === 'standard') qaAddPercent = 0.18;
  if (state.qaLevel === 'automated_security') qaAddPercent = 0.32;

  // Architecture & Discovery Overhead
  const discoveryOverheadPercent = 0.12;

  const totalMultiplier = platformMult * complexityMult * (1 + designAddPercent + qaAddPercent + discoveryOverheadPercent);
  const totalHours = Math.round(baseFeatureHours * totalMultiplier);

  // 6. Calculate Team Capacity & Monthly Burn
  let teamTotalMonthlyCapacityHours = 0;
  let teamMonthlyBurnRate = 0;
  let totalWeightedRateSum = 0;
  let totalActiveHeadcount = 0;

  const activeTeam = state.team.length > 0 ? state.team : generateRecommendedTeam(
    state.selectedFeatureIds,
    state.platforms,
    state.complexity,
    state.designLevel
  );

  const costByRoleCategory: Record<RoleCategory, number> = {
    engineering: 0,
    design: 0,
    management: 0,
    qa_devops: 0
  };

  const hoursByRoleCategory: Record<RoleCategory, number> = {
    engineering: 0,
    design: 0,
    management: 0,
    qa_devops: 0
  };

  activeTeam.forEach((member) => {
    const role = TEAM_ROLES.find((r) => r.id === member.roleId);
    const category: RoleCategory = role ? role.category : 'engineering';

    const hourlyRate = calculateEffectiveMemberRate(
      member.roleId,
      state.regionId,
      member.experienceLevel,
      member.customRate
    );

    let monthlyHours = 160;
    if (member.engagement === 'parttime_50') monthlyHours = 80;
    if (member.engagement === 'parttime_25') monthlyHours = 40;

    const totalMemberMonthlyHours = monthlyHours * member.count;
    const memberMonthlyCost = hourlyRate * totalMemberMonthlyHours;

    const expConfig = EXPERIENCE_MULTIPLIERS[member.experienceLevel] || EXPERIENCE_MULTIPLIERS.senior;
    const velocityCapacityHours = totalMemberMonthlyHours * expConfig.velocityMultiplier;

    teamMonthlyBurnRate += memberMonthlyCost;
    teamTotalMonthlyCapacityHours += velocityCapacityHours;
    costByRoleCategory[category] += memberMonthlyCost;
    hoursByRoleCategory[category] += totalMemberMonthlyHours;

    totalWeightedRateSum += hourlyRate * member.count;
    totalActiveHeadcount += member.count;
  });

  const effectiveHourlyRate = totalActiveHeadcount > 0 ? Math.round(totalWeightedRateSum / totalActiveHeadcount) : 75;

  // 7. Timeline Calculations
  const calculatedTimelineMonths = teamTotalMonthlyCapacityHours > 0
    ? Math.max(0.75, Math.round((totalHours / teamTotalMonthlyCapacityHours) * 10) / 10)
    : 3;
  const estimatedTimelineWeeks = Math.round(calculatedTimelineMonths * 4.33);

  let velocityStatus: EstimateResult['velocityStatus'] = 'balanced';
  if (state.targetTimelineWeeks) {
    if (estimatedTimelineWeeks > state.targetTimelineWeeks * 1.3) {
      velocityStatus = 'understaffed';
    } else if (estimatedTimelineWeeks < state.targetTimelineWeeks * 0.7) {
      velocityStatus = 'accelerated';
    }
  }

  // 8. Base Labor Cost
  const baseLaborCost = Math.round(teamMonthlyBurnRate * calculatedTimelineMonths);

  // 9. Buffer, Margin & Extras
  const contingencyAmount = Math.round(baseLaborCost * (state.contingencyBufferPercent / 100));
  const profitMarginAmount = Math.round(baseLaborCost * (state.profitMarginPercent / 100));

  // Custom parameters
  let customParamsCost = 0;
  state.customParams.forEach((param) => {
    if (param.type === 'fixed_cost') {
      customParamsCost += param.value;
    } else {
      customParamsCost += param.value * effectiveHourlyRate;
    }
  });

  // SaaS Add-ons
  const selectedSaaS = SAAS_ADDONS.filter((s) => state.selectedSaaSAddons.includes(s.id));
  const monthlySaaSCost = selectedSaaS.reduce((sum, s) => sum + s.monthlyEstimate, 0);

  // Maintenance Post-Launch Cost
  let maintenanceMonths = 0;
  if (state.maintenancePeriod === '3_months') maintenanceMonths = 3;
  if (state.maintenancePeriod === '6_months') maintenanceMonths = 6;
  if (state.maintenancePeriod === '12_months') maintenanceMonths = 12;

  // Monthly retainer estimated at ~15% of team burn rate
  const monthlyMaintenanceRetainer = Math.round(teamMonthlyBurnRate * 0.15);
  const maintenanceCost = monthlyMaintenanceRetainer * maintenanceMonths;

  const grandTotalCost = baseLaborCost + contingencyAmount + profitMarginAmount + customParamsCost + maintenanceCost + Math.round(monthlySaaSCost * calculatedTimelineMonths);

  // 10. Phase Milestone Breakdown
  const phaseBreakdown = [
    {
      phase: '1. Discovery & Architecture',
      percentage: 12,
      hours: Math.round(totalHours * 0.12),
      cost: Math.round(baseLaborCost * 0.12),
      description: 'Requirements, system architecture, database design & UX wireframes.'
    },
    {
      phase: '2. UI/UX High-Fidelity Design',
      percentage: 16,
      hours: Math.round(totalHours * 0.16),
      cost: Math.round(baseLaborCost * 0.16),
      description: 'Design system, screen prototypes & responsive design specifications.'
    },
    {
      phase: '3. Core Sprint Development',
      percentage: 48,
      hours: Math.round(totalHours * 0.48),
      cost: Math.round(baseLaborCost * 0.48),
      description: 'Frontend UI, Backend APIs, Database, Integrations & Mobile builds.'
    },
    {
      phase: '4. QA Testing & Security Audit',
      percentage: 14,
      hours: Math.round(totalHours * 0.14),
      cost: Math.round(baseLaborCost * 0.14),
      description: 'Automated test suite, performance tuning, penetration testing & bug fixes.'
    },
    {
      phase: '5. DevOps, Cloud Launch & Handoff',
      percentage: 10,
      hours: Math.round(totalHours * 0.10),
      cost: Math.round(baseLaborCost * 0.10),
      description: 'Production deployment, CI/CD pipeline, monitoring, documentation & training.'
    }
  ];

  return {
    totalHours,
    baseLaborCost,
    contingencyAmount,
    profitMarginAmount,
    maintenanceCost,
    customParamsCost,
    monthlySaaSCost,
    grandTotalCost,
    effectiveHourlyRate,
    teamMonthlyBurnRate,
    teamTotalMonthlyCapacityHours,
    estimatedTimelineMonths: calculatedTimelineMonths,
    estimatedTimelineWeeks,
    velocityStatus,
    costByRoleCategory,
    hoursByRoleCategory,
    phaseBreakdown,
    recommendedTeam: activeTeam
  };
}
