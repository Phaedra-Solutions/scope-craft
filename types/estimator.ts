export type ProjectPlatform = 'web' | 'ios' | 'android' | 'cross_platform' | 'desktop';

export type ComplexityLevel = 'mvp' | 'standard' | 'enterprise';

export type DesignLevel = 'wireframe' | 'standard_ui' | 'custom_bespoke';

export type QALevel = 'basic' | 'standard' | 'automated_security';

export type MaintenancePeriod = 'none' | '3_months' | '6_months' | '12_months';

export type FeatureCategory = 
  | 'auth'
  | 'monetization'
  | 'ai_ml'
  | 'communication'
  | 'content_cms'
  | 'analytics_data'
  | 'integrations'
  | 'security_compliance'
  | 'ui_ux_extras'
  | 'devops_cloud';

export interface FeatureItem {
  id: string;
  name: string;
  category: FeatureCategory;
  description: string;
  baseHours: number;
  complexityMultiplier?: Record<ComplexityLevel, number>;
  iconName?: string;
  recommendedRoles?: string[]; // Role IDs
}

export type RoleCategory = 'engineering' | 'design' | 'management' | 'qa_devops';

export interface TeamRole {
  id: string;
  title: string;
  category: RoleCategory;
  defaultHourlyRate: number; // Base rate in USD
  description: string;
  iconName?: string;
}

export type ExperienceLevel = 'junior' | 'mid' | 'senior' | 'lead';

export interface ExperienceMultiplier {
  label: string;
  rateMultiplier: number;
  velocityMultiplier: number; // How fast/efficient they work
}

export type EngagementType = 'fulltime' | 'parttime_50' | 'parttime_25';

export interface TeamMemberConfig {
  id: string;
  roleId: string;
  count: number;
  experienceLevel: ExperienceLevel;
  customRate?: number; // Override rate if set
  engagement: EngagementType;
}

export interface RegionConfig {
  id: string;
  name: string;
  flag: string;
  rateMultiplier: number;
  description: string;
  avgSeniorRate: number;
}

export interface CustomParam {
  id: string;
  name: string;
  category: string;
  type: 'fixed_cost' | 'hours';
  value: number;
  description?: string;
}

export interface SaaSAddon {
  id: string;
  name: string;
  category: string;
  monthlyEstimate: number;
  selected: boolean;
  description: string;
}

export interface CurrencyConfig {
  code: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'INR';
  symbol: string;
  exchangeRate: number; // relative to USD
}

export interface ProjectState {
  projectName: string;
  clientName: string;
  targetTimelineWeeks: number;
  platforms: ProjectPlatform[];
  complexity: ComplexityLevel;
  designLevel: DesignLevel;
  qaLevel: QALevel;
  maintenancePeriod: MaintenancePeriod;
  selectedFeatureIds: string[];
  regionId: string;
  team: TeamMemberConfig[];
  contingencyBufferPercent: number; // e.g. 15%
  profitMarginPercent: number; // e.g. 10%
  customParams: CustomParam[];
  selectedSaaSAddons: string[];
  engagementModel: 'dedicated_team' | 'time_and_materials' | 'fixed_price';
}

export interface EstimateResult {
  totalHours: number;
  baseLaborCost: number;
  contingencyAmount: number;
  profitMarginAmount: number;
  maintenanceCost: number;
  customParamsCost: number;
  monthlySaaSCost: number;
  grandTotalCost: number;
  effectiveHourlyRate: number;
  
  // Timeline & Velocity
  teamMonthlyBurnRate: number;
  teamTotalMonthlyCapacityHours: number;
  estimatedTimelineMonths: number;
  estimatedTimelineWeeks: number;
  velocityStatus: 'understaffed' | 'balanced' | 'accelerated';
  
  // Breakdowns
  costByRoleCategory: Record<RoleCategory, number>;
  hoursByRoleCategory: Record<RoleCategory, number>;
  phaseBreakdown: {
    phase: string;
    percentage: number;
    hours: number;
    cost: number;
    description: string;
  }[];
  
  recommendedTeam: TeamMemberConfig[];
}

export interface PresetTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  badge: string;
  state: Partial<ProjectState>;
}

export interface ScenarioComparisonItem {
  id: string;
  name: string;
  state: ProjectState;
  result: EstimateResult;
}

export interface LeadProfile {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  budgetRange: string;
  marketingConsent: boolean;
  privacyAccepted: boolean;
  submittedAt: string;
  wantsOptionalPaidReview?: boolean;
}
