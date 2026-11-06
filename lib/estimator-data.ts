import {
  FeatureItem,
  TeamRole,
  RegionConfig,
  PresetTemplate,
  SaaSAddon,
  CurrencyConfig,
  ExperienceMultiplier,
  ExperienceLevel
} from '@/types/estimator';

export const CURRENCIES: CurrencyConfig[] = [
  { code: 'USD', symbol: '$', exchangeRate: 1.0 },
  { code: 'EUR', symbol: '€', exchangeRate: 0.92 },
  { code: 'GBP', symbol: '£', exchangeRate: 0.79 },
  { code: 'CAD', symbol: 'CA$', exchangeRate: 1.36 },
  { code: 'AUD', symbol: 'A$', exchangeRate: 1.52 },
  { code: 'INR', symbol: '₹', exchangeRate: 83.5 },
];

export const REGIONS: RegionConfig[] = [
  {
    id: 'phaedra',
    name: 'Phaedra Solutions (default)',
    flag: '⚡',
    rateMultiplier: 0.30,
    avgSeniorRate: 33,
    description: 'Phaedra Solutions dedicated agile engineering teams & high-velocity delivery (30% benchmark)'
  },
  {
    id: 'us_canada',
    name: 'USA/Canada',
    flag: '🇺🇸',
    rateMultiplier: 1.0,
    avgSeniorRate: 110,
    description: 'Tier-1 Onshore Agency / US & Canadian Senior Engineers (100% benchmark)'
  },
  {
    id: 'europe',
    name: 'Europe',
    flag: '🇪🇺',
    rateMultiplier: 0.68,
    avgSeniorRate: 75,
    description: 'Pan-European tech talent & engineering delivery centers (68% benchmark)'
  },
  {
    id: 'middle_east',
    name: 'Middle East',
    flag: '🇦🇪',
    rateMultiplier: 0.50,
    avgSeniorRate: 55,
    description: 'Middle East & GCC regional tech delivery hubs (50% benchmark)'
  },
  {
    id: 'south_east',
    name: 'South East',
    flag: '🇸🇬',
    rateMultiplier: 0.40,
    avgSeniorRate: 44,
    description: 'Southeast Asian engineering talent & delivery hubs (40% benchmark)'
  }
];

export const EXPERIENCE_MULTIPLIERS: Record<ExperienceLevel, ExperienceMultiplier> = {
  junior: { label: 'Junior (1-2 yrs)', rateMultiplier: 0.6, velocityMultiplier: 0.7 },
  mid: { label: 'Mid-Level (3-5 yrs)', rateMultiplier: 0.85, velocityMultiplier: 0.95 },
  senior: { label: 'Senior (6-9 yrs)', rateMultiplier: 1.0, velocityMultiplier: 1.2 },
  lead: { label: 'Lead / Principal (10+ yrs)', rateMultiplier: 1.3, velocityMultiplier: 1.45 }
};

export const TEAM_ROLES: TeamRole[] = [
  {
    id: 'tech_lead',
    title: 'Solutions Architect / Tech Lead',
    category: 'management',
    defaultHourlyRate: 115,
    description: 'System architecture, code review, tech decisions & technical team oversight.',
    iconName: 'ShieldCheck'
  },
  {
    id: 'fullstack_dev',
    title: 'Senior Full-Stack Engineer',
    category: 'engineering',
    defaultHourlyRate: 95,
    description: 'End-to-end web architecture, Node/Python/Go + React/Next.js.',
    iconName: 'Code2'
  },
  {
    id: 'frontend_dev',
    title: 'Frontend Engineer',
    category: 'engineering',
    defaultHourlyRate: 85,
    description: 'Responsive UI components, state management, web performance.',
    iconName: 'Layout'
  },
  {
    id: 'backend_dev',
    title: 'Backend Engineer',
    category: 'engineering',
    defaultHourlyRate: 90,
    description: 'REST/GraphQL APIs, database schema, microservices, auth.',
    iconName: 'Database'
  },
  {
    id: 'mobile_dev',
    title: 'Mobile App Developer (iOS/Android)',
    category: 'engineering',
    defaultHourlyRate: 92,
    description: 'React Native / Flutter / Swift / Kotlin native mobile app engineering.',
    iconName: 'Smartphone'
  },
  {
    id: 'ui_ux_designer',
    title: 'UI/UX Product Designer',
    category: 'design',
    defaultHourlyRate: 80,
    description: 'Figma wireframing, high-fidelity UI design systems, interactive prototypes.',
    iconName: 'Palette'
  },
  {
    id: 'qa_engineer',
    title: 'QA & Automation Engineer',
    category: 'qa_devops',
    defaultHourlyRate: 68,
    description: 'Manual test cases, Playwright/Cypress end-to-end automated test suites.',
    iconName: 'CheckCircle2'
  },
  {
    id: 'devops_cloud',
    title: 'DevOps & Cloud Engineer',
    category: 'qa_devops',
    defaultHourlyRate: 98,
    description: 'CI/CD pipelines, Docker, Kubernetes, AWS/GCP infrastructure as code.',
    iconName: 'Cloud'
  },
  {
    id: 'product_manager',
    title: 'Technical Product Manager',
    category: 'management',
    defaultHourlyRate: 88,
    description: 'Sprint planning, user story grooming, milestone tracking & stakeholder sync.',
    iconName: 'Kanban'
  },
  {
    id: 'scrum_master',
    title: 'Scrum Master / Agile Lead',
    category: 'management',
    defaultHourlyRate: 75,
    description: 'Facilitates daily standups, sprint retrospectives & unblocking team.',
    iconName: 'Clock'
  }
];

export const FEATURE_CATALOG: FeatureItem[] = [
  // Auth & Security
  {
    id: 'auth_basic',
    name: 'Email / Password & Magic Link Auth',
    category: 'auth',
    description: 'User registration, login, password reset, session cookies & JWT tokens.',
    baseHours: 28,
    iconName: 'Key',
    recommendedRoles: ['backend_dev', 'frontend_dev']
  },
  {
    id: 'auth_sso',
    name: 'Social SSO & OAuth2 (Google, Apple, GitHub)',
    category: 'auth',
    description: 'One-click sign in with Google, Apple ID, GitHub, Microsoft.',
    baseHours: 24,
    iconName: 'Share2',
    recommendedRoles: ['backend_dev', 'frontend_dev']
  },
  {
    id: 'auth_mfa',
    name: '2FA / MFA Multi-Factor Auth',
    category: 'auth',
    description: 'TOTP Authenticator app codes, SMS OTP backup, recovery codes.',
    baseHours: 32,
    iconName: 'Lock',
    recommendedRoles: ['backend_dev']
  },
  {
    id: 'auth_rbac',
    name: 'Role-Based Access Control (RBAC) & Teams',
    category: 'auth',
    description: 'Multi-tenant organization accounts, roles (Admin, Editor, Viewer), invite links.',
    baseHours: 48,
    iconName: 'Users',
    recommendedRoles: ['backend_dev', 'fullstack_dev']
  },

  // Monetization
  {
    id: 'pay_stripe',
    name: 'Stripe Billing & Subscription Checkout',
    category: 'monetization',
    description: 'Monthly/annual plans, upgrade/downgrade, invoices, customer portal.',
    baseHours: 42,
    iconName: 'CreditCard',
    recommendedRoles: ['fullstack_dev', 'backend_dev']
  },
  {
    id: 'pay_usage',
    name: 'Usage-Based Metered Billing',
    category: 'monetization',
    description: 'Token or API usage tracking, overage billing calculations, real-time caps.',
    baseHours: 40,
    iconName: 'BarChart',
    recommendedRoles: ['backend_dev']
  },
  {
    id: 'pay_marketplace',
    name: 'Multi-Vendor Split Payments (Stripe Connect)',
    category: 'monetization',
    description: 'Escrow, marketplace commission split, seller payouts, tax handling.',
    baseHours: 72,
    iconName: 'Coins',
    recommendedRoles: ['backend_dev', 'tech_lead']
  },

  // AI & Machine Learning
  {
    id: 'ai_llm_chat',
    name: 'Gemini LLM AI Conversational Assistant',
    category: 'ai_ml',
    description: 'Context-aware AI chat agent, system instructions, streaming markdown UI.',
    baseHours: 45,
    iconName: 'Sparkles',
    recommendedRoles: ['fullstack_dev']
  },
  {
    id: 'ai_rag_vectors',
    name: 'Vector Search & Document RAG Engine',
    category: 'ai_ml',
    description: 'Embedding pipeline, vector database (Pinecone/pgvector), PDF document Q&A.',
    baseHours: 65,
    iconName: 'FileSearch',
    recommendedRoles: ['backend_dev', 'tech_lead']
  },
  {
    id: 'ai_vision_ocr',
    name: 'Multimodal Vision & Document OCR Extraction',
    category: 'ai_ml',
    description: 'Image & PDF scanning, automated text parsing, structured JSON extraction.',
    baseHours: 50,
    iconName: 'Eye',
    recommendedRoles: ['backend_dev']
  },

  // Communication & Realtime
  {
    id: 'chat_realtime',
    name: 'Realtime WebSocket 1:1 & Group Chat',
    category: 'communication',
    description: 'Instant messages, typing indicators, read receipts, online presence badges.',
    baseHours: 68,
    iconName: 'MessageSquare',
    recommendedRoles: ['backend_dev', 'frontend_dev']
  },
  {
    id: 'notifications_push',
    name: 'Push Notifications (Web & Mobile FCM/APNs)',
    category: 'communication',
    description: 'Transactional device notifications, user preference center, badge counts.',
    baseHours: 36,
    iconName: 'Bell',
    recommendedRoles: ['mobile_dev', 'backend_dev']
  },

  // Content & CMS
  {
    id: 'cms_admin',
    name: 'Custom Admin Dashboard & Content CMS',
    category: 'content_cms',
    description: 'Data tables, filter/search records, edit content, user management, audit logs.',
    baseHours: 75,
    iconName: 'LayoutGrid',
    recommendedRoles: ['frontend_dev', 'backend_dev']
  },
  {
    id: 'media_upload',
    name: 'S3 File & Media Upload / CDN Pipeline',
    category: 'content_cms',
    description: 'Drag & drop file uploader, image resizing, secure pre-signed S3 URLs.',
    baseHours: 30,
    iconName: 'UploadCloud',
    recommendedRoles: ['backend_dev']
  },

  // Analytics & Data
  {
    id: 'analytics_charts',
    name: 'Interactive Analytics & KPI Dashboards',
    category: 'analytics_data',
    description: 'Custom charts, revenue metrics, user cohort analytics, export CSV/PDF.',
    baseHours: 55,
    iconName: 'TrendingUp',
    recommendedRoles: ['frontend_dev', 'backend_dev']
  },
  {
    id: 'search_elastic',
    name: 'Full-Text Global Search & Auto-complete',
    category: 'analytics_data',
    description: 'Fuzzy search, filters, instant indexing with Algolia or Elasticsearch.',
    baseHours: 42,
    iconName: 'Search',
    recommendedRoles: ['backend_dev']
  },

  // Integrations & APIs
  {
    id: 'integration_thirdparty',
    name: 'Third-Party REST/GraphQL API Suite',
    category: 'integrations',
    description: 'Integrations with CRM (HubSpot/Salesforce), Email (SendGrid), Twilio SMS.',
    baseHours: 45,
    iconName: 'Plug',
    recommendedRoles: ['backend_dev']
  },
  {
    id: 'integration_webhooks',
    name: 'Webhook Dispatcher & Developer API Portal',
    category: 'integrations',
    description: 'API Key generation, rate limiting, outgoing webhook retry queues.',
    baseHours: 50,
    iconName: 'Workflow',
    recommendedRoles: ['backend_dev', 'tech_lead']
  },

  // Security & Compliance
  {
    id: 'sec_compliance',
    name: 'HIPAA / GDPR Compliance & Field Encryption',
    category: 'security_compliance',
    description: 'Database encryption at rest/transit, audit logging, data deletion flow.',
    baseHours: 85,
    iconName: 'ShieldAlert',
    recommendedRoles: ['tech_lead', 'devops_cloud']
  }
];

export const SAAS_ADDONS: SaaSAddon[] = [
  {
    id: 'aws_gcp',
    name: 'Cloud Hosting (AWS / GCP / Cloud Run)',
    category: 'infrastructure',
    monthlyEstimate: 180,
    selected: true,
    description: 'Managed servers, database instances, load balancers, SSL & networking.'
  },
  {
    id: 'database_managed',
    name: 'Managed Postgres (Supabase / Neon / Cloud SQL)',
    category: 'infrastructure',
    monthlyEstimate: 65,
    selected: true,
    description: 'Automated backups, scaling, connection pooling & failover.'
  },
  {
    id: 'ai_api_budget',
    name: 'Gemini / OpenAI API Inference Tokens',
    category: 'ai',
    monthlyEstimate: 120,
    selected: true,
    description: 'Estimated monthly LLM token budget for ~20k user interactions.'
  },
  {
    id: 'vercel_cdn',
    name: 'Vercel / Cloudflare Edge CDN & Security',
    category: 'infrastructure',
    monthlyEstimate: 40,
    selected: true,
    description: 'Global edge distribution, DDoS mitigation & image optimization.'
  },
  {
    id: 'email_sms',
    name: 'SendGrid Email & Twilio SMS Gateway',
    category: 'communication',
    monthlyEstimate: 35,
    selected: false,
    description: 'Transactional email notifications, OTP delivery & domain authentication.'
  },
  {
    id: 'monitoring_sentry',
    name: 'Sentry Error Tracking & PostHog Analytics',
    category: 'observability',
    monthlyEstimate: 50,
    selected: true,
    description: 'Real-time error alerts, session recordings & product telemetry.'
  }
];

export const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: 'saas_mvp',
    title: 'SaaS MVP Platform',
    description: 'Web application with user auth, Stripe subscriptions, Admin CMS, and Analytics.',
    icon: 'Rocket',
    badge: 'Popular',
    state: {
      projectName: 'B2B SaaS Platform MVP',
      platforms: ['web'],
      complexity: 'mvp',
      designLevel: 'standard_ui',
      qaLevel: 'standard',
      targetTimelineWeeks: 10,
      regionId: 'phaedra',
      selectedFeatureIds: ['auth_basic', 'auth_sso', 'pay_stripe', 'cms_admin', 'analytics_charts'],
      engagementModel: 'dedicated_team',
      contingencyBufferPercent: 15,
      profitMarginPercent: 10
    }
  },
  {
    id: 'mobile_crossplatform',
    title: 'On-Demand Mobile App',
    description: 'iOS & Android app with location maps, push notifications, 1:1 chat & Stripe payments.',
    icon: 'Smartphone',
    badge: 'Mobile',
    state: {
      projectName: 'On-Demand Mobile App',
      platforms: ['ios', 'android'],
      complexity: 'standard',
      designLevel: 'custom_bespoke',
      qaLevel: 'standard',
      targetTimelineWeeks: 14,
      regionId: 'phaedra',
      selectedFeatureIds: ['auth_basic', 'auth_sso', 'pay_stripe', 'chat_realtime', 'notifications_push', 'media_upload'],
      engagementModel: 'dedicated_team',
      contingencyBufferPercent: 15,
      profitMarginPercent: 10
    }
  },
  {
    id: 'ai_enterprise',
    title: 'AI Enterprise Knowledge Portal',
    description: 'Web & API with Gemini LLM integration, Vector RAG search, RBAC, & HIPAA/GDPR security.',
    icon: 'Sparkles',
    badge: 'AI & Enterprise',
    state: {
      projectName: 'AI Enterprise Intelligence Portal',
      platforms: ['web'],
      complexity: 'enterprise',
      designLevel: 'custom_bespoke',
      qaLevel: 'automated_security',
      targetTimelineWeeks: 18,
      regionId: 'phaedra',
      selectedFeatureIds: [
        'auth_basic', 'auth_sso', 'auth_mfa', 'auth_rbac',
        'ai_llm_chat', 'ai_rag_vectors', 'ai_vision_ocr',
        'cms_admin', 'analytics_charts', 'sec_compliance', 'integration_webhooks'
      ],
      engagementModel: 'dedicated_team',
      contingencyBufferPercent: 20,
      profitMarginPercent: 12
    }
  },
  {
    id: 'fintech_wallet',
    title: 'Fintech Payment & Banking App',
    description: 'iOS + Android cross-platform app with high security, MFA, banking API suite, and audit logs.',
    icon: 'ShieldCheck',
    badge: 'Fintech',
    state: {
      projectName: 'Next-Gen Fintech Mobile Wallet',
      platforms: ['cross_platform'],
      complexity: 'enterprise',
      designLevel: 'custom_bespoke',
      qaLevel: 'automated_security',
      targetTimelineWeeks: 20,
      regionId: 'us_canada',
      selectedFeatureIds: [
        'auth_basic', 'auth_mfa', 'auth_rbac', 'pay_stripe', 'pay_usage',
        'notifications_push', 'analytics_charts', 'integration_thirdparty', 'sec_compliance'
      ],
      engagementModel: 'dedicated_team',
      contingencyBufferPercent: 20,
      profitMarginPercent: 15
    }
  },
  {
    id: 'ecommerce_marketplace',
    title: 'Multi-Vendor Marketplace',
    description: 'E-commerce platform with buyer/seller portals, Stripe Connect payouts, search & reviews.',
    icon: 'ShoppingBag',
    badge: 'E-Commerce',
    state: {
      projectName: 'Multi-Vendor E-Commerce Platform',
      platforms: ['web', 'ios', 'android'],
      complexity: 'standard',
      designLevel: 'custom_bespoke',
      qaLevel: 'standard',
      targetTimelineWeeks: 16,
      regionId: 'phaedra',
      selectedFeatureIds: [
        'auth_basic', 'auth_sso', 'pay_marketplace', 'cms_admin',
        'media_upload', 'search_elastic', 'analytics_charts', 'notifications_push'
      ],
      engagementModel: 'dedicated_team',
      contingencyBufferPercent: 15,
      profitMarginPercent: 10
    }
  }
];
