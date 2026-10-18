export type PropertyType =
  | 'Condo'
  | 'Condominium'
  | 'Apartment'
  | 'Terrace'
  | 'Semi-detached'
  | 'Detached'
  | 'HDB'
  | 'HDB Resale'
  | 'HDB Resale (5-Room Premium)'
  | 'Executive Condominium'
  | 'Landed'
  | 'Bungalow'
  | 'Townhouse'
  | string;
export type PurchasePurpose = 'Buy' | 'Rent';
export type TenureType =
  | 'Freehold'
  | 'Leasehold'
  | 'Leasehold 99-year'
  | '99-year Leasehold'
  | 'Leasehold 999-year'
  | '999-year Leasehold'
  | string;
export type CountryCode = 'Malaysia' | 'Singapore' | 'India';
export type CountryPreference = CountryCode;
export type ResidencyStatus = 'Citizen' | 'Permanent Resident' | 'Foreign Buyer';
export type BuyerRole = 'First-time Homebuyer' | 'Upgrader' | 'Property Investor';
export type ModuleStatus =
  | 'pending'
  | 'in_progress'
  | 'in progress'
  | 'passed'
  | 'review_required'
  | 'restricted'
  | 'completed'
  | 'done'
  | 'not started'
  | string;

export interface NearbyFacility {
  category:
    | 'Transit'
    | 'Healthcare'
    | 'Education'
    | 'Retail'
    | 'Lifestyle'
    | 'Business'
    | 'Culture'
    | 'Commercial'
    | 'Dining'
    | 'Park'
    | 'Employment'
    | string;
  name: string;
  distance: string;
}

export interface DeveloperSignals {
  developerName: string;
  reputationScore: string;
  completedProjectsCount?: string;
  averageDelayMonths?: string;
  regulatoryNotices?: string;
  warrantyAssessment?: string;
  summary?: string;
  deliveryTrackRecord?: string;
  defectLiabilityRating?: string;
  financialStabilityGrade?: string;
  notablePastProjects?: string[];
  litigationChecks?: string;
}

export interface ValuationMetrics {
  fairValueMin: number;
  fairValueMax: number;
  pricePerSqFt: number;
  districtMedianPsqft: number;
  marketPosition: 'Below Fair Value' | 'Below Market Value' | 'Fairly Valued' | 'Premium Tier' | 'Overpriced' | string;
  estimatedRentalValue: number;
  grossRentalYield: string;
  reasoning: string;
}

export interface LegalApprovalStatus {
  isApproved?: boolean;
  regulatoryAuthority?: string;
  certificateType?: string;
  certificateNumber?: string;
  issueDate?: string;
  apdlNumber?: string;
  apdlValidity?: string;
  strataTitleStatus: string;
  landRegistrySearch?: string;
  encumbrances: string;
  zoningClassification?: string;
  localAuthorityApproval?: string;
  masterOrIndividualTitle?: string;
  restrictionInInterest?: string;
  bumiLotStatus?: string;
  strataManagementStatus?: string;
}

export interface TransactedUnitRecord {
  unit?: string;
  builtUpSqft?: number;
  transactedPrice: number;
  psqft: number;
  contractDate?: string;
  date?: string;
  tenure?: string;
  unitType?: string;
  caveatStatus?: string;
}

export interface NapicUraData {
  dataSource?: string;
  datasetCitation?: string;
  submarketName?: string;
  submarketCode?: string;
  quarterlyPriceIndex: string;
  medianTransactedPsqft: number;
  lastTransactedDate?: string;
  transactionVolume12Mo?: number;
  totalTransactions12m?: number;
  absorptionRate?: string;
  officialValuationConfidence?: string;
  submarketStockStatus?: 'Healthy Absorption' | 'Supply Surplus' | 'High Demand';
  recentTransactedUnits?: TransactedUnitRecord[];
  recentTransactedComparables?: any[];
  overhangRiskLevel?: 'Low' | 'Moderate' | 'Elevated';
  registryVerificationSeal?: string;
}

export interface GoogleMapsData {
  latitude?: number;
  longitude?: number;
  zoomLevel?: number;
  streetViewAvailable?: boolean;
  streetViewHeading?: number;
  streetViewPitch?: number;
  streetViewPanoUrl?: string;
  googleMapsDirectionsUrl?: string;
  mapEmbedUrl?: string;
  streetViewEmbedUrl?: string;
  directMapsUrl?: string;
  directStreetViewUrl?: string;
}

export interface FloorPlanVariation {
  typeCode: string; // e.g. "Type A", "Type B", "Type C (Dual Key)"
  name: string; // e.g. "2-Bedroom Executive Suite", "3-Bedroom Family Suite", "4-Bedroom Sky Villa"
  builtUpSqft: number;
  bedrooms: number;
  bathrooms: number;
  floorPlanImageUrl: string;
  keyFeatures: string[];
  dimensions?: {
    livingDining?: string;
    masterBedroom?: string;
    balcony?: string;
    kitchen?: string;
  };
  startingPrice?: number;
}

export interface MarketDataSources {
  brickzPriceRef?: string;
  edgePropUnsoldStats?: string;
  ssmRegistrationNo?: string;
  ssmStatus?: string;
  jupemTitleNumber?: string;
  oneMapSlaDetails?: string;
  dataGovHdbResaleMedian?: string;
  uraCaveatsCitation?: string;
}

export interface PhotoGallery {
  exterior: string[];
  interior: string[];
  streetView?: string[];
  streetview?: string[];
  floorPlans?: string[];
  floorplans?: string[];
}

export interface Property {
  id: string;
  title: string;
  propertyType: PropertyType;
  purpose: PurchasePurpose;
  price: number;
  currency: string;
  address: string;
  city: string;
  stateDistrict: string;
  country: CountryCode;
  bedrooms: number;
  bathrooms: number;
  builtUpArea: number;
  tenure: TenureType;
  developer: string;
  yearBuilt: number;
  maintenanceFeePerSqft: number;
  estimatedRentalValue: number;
  images: string[];
  description: string;
  amenities: string[];
  nearbyFacilities: NearbyFacility[];
  valuation: ValuationMetrics;
  developerSignals: DeveloperSignals;
  legalStatus: LegalApprovalStatus;
  napicUraData: NapicUraData;
  coordinates: {
    lat: number;
    lng: number;
  };
  googleMaps: GoogleMapsData;
  photoGallery?: PhotoGallery;
  floorPlanVariations?: FloorPlanVariation[];
  marketDataSources?: MarketDataSources;
}

export interface CountryChecklistItem {
  id: string;
  category?: string;
  label?: string;
  title?: string;
  description: string;
  completed?: boolean;
  status?: string;
  critical?: boolean;
  notes?: string;
}

export interface SiteVisitItem {
  id: string;
  category?: string;
  title?: string;
  label?: string;
  description?: string;
  completed?: boolean;
  notes?: string;
  status?: string;
}

export interface RecordedInspectionVideo {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  durationSeconds: number;
  timestamp: string;
  defectsNoted?: string[];
  aiSummary?: string;
  transcripts?: Array<{ speaker: string; text: string; timestamp: string }>;
}

export interface ModuleCountryCompliance {
  country: CountryCode;
  status?: 'passed' | 'review_required' | 'restricted' | any;
  eligibilityNotes?: string;
  regulatoryCitation?: string;
  buyerEligibility?: {
    status: 'Eligible' | 'Approval Required' | 'Restricted';
    conditions: string[];
  };
  foreignBuyerThreshold?: {
    minPriceRequired: number;
    currency: string;
    meetsRequirement: boolean;
  };
  stampDuty?: {
    buyerStampDuty: number;
    additionalBuyerStampDuty: number;
    currency: string;
    breakdownNote: string;
  };
  legalRestrictions?: string[];
  checklist?: any[];
  completed?: boolean;
  notes?: string;
  [key: string]: any;
}

export interface ModuleDeveloperRisk {
  score: 'Low Risk' | 'Moderate Risk' | 'High Risk' | any;
  developerProfile: DeveloperSignals;
  keyRisks: string[];
  mitigatingFactors: string[];
  auditNotes: string;
}

export interface ModuleValuationCorridor {
  corridor: {
    lowerBound: number;
    fairValue: number;
    upperBound: number;
    currency: string;
  };
  pricingAnalysis: string;
  projectedExitCapRate: string;
  rentalYieldNet: string;
  valuationMetrics: ValuationMetrics;
}

export interface ModuleHiddenCost {
  items: Array<{
    name: string;
    amount: number;
    category: 'Upfront' | 'Recurring' | 'Contingency';
    timing: string;
  }>;
  totalUpfrontEstimated: number;
  totalMonthlyEstimated: number;
  currency: string;
  sinkingFundRisk: 'Low' | 'Moderate' | 'High' | any;
}

export interface ModuleDsrStressTest {
  passed: boolean;
  baselineDsr: number;
  stressedDsr: number;
  maxAllowedDsr: number;
  monthlyIncome: number;
  existingDebts: number;
  monthlyInstallmentBaseline: number;
  monthlyInstallmentStressed: number;
  downPaymentPercent: number;
  loanAmount: number;
  interestRateBaseline: number;
  interestRateStressed: number;
  tenureYears: number;
  recommendation: string;
}

export interface CaseFileModules {
  countryCompliance: ModuleCountryCompliance;
  developerRisk?: ModuleDeveloperRisk;
  valuationCorridor?: ModuleValuationCorridor;
  hiddenCost?: ModuleHiddenCost;
  dsrStressTest?: ModuleDsrStressTest;
  developerAudit?: any;
  priceAnalysis?: any;
  stressTest?: any;
  siteVisit?: any;
  [key: string]: any;
}

export interface DecisionProfile {
  buyerPersona?: string;
  marketPosition?: string;
  holdingPeriodYears?: number;
  exitStrategy?: string;
  affordability?: string;
  riskSignals?: string;
  downsideResilience?: string;
  strengths?: string[];
  risks?: string[];
  verdictRecommendation?: string;
  negotiationAdvice?: string;
  lastSynthesizedAt?: string;
  [key: string]: any;
}

export interface CaseFile {
  caseId: string;
  propertyId: string;
  createdAt?: string;
  createdDate?: string;
  lastUpdated?: string;
  status: 'Draft' | 'In Progress' | 'In Analysis' | 'Decision Ready' | 'Archived' | any;
  title?: string;
  propertyTitle?: string;
  city?: string;
  askingPrice?: number;
  currency?: string;
  overallDiligenceScore?: number;
  recommendation?: 'Proceed with Caution' | 'Strong Buy' | 'Negotiate Price Down' | 'Do Not Proceed' | any;
  summaryVerdict?: string;
  modules: CaseFileModules;
  decisionProfile: DecisionProfile;
  progressPercent?: number;
  isArchived?: boolean;
  archivedAt?: string;
  [key: string]: any;
}

export interface UserProfile {
  id?: string;
  name: string;
  displayName?: string;
  email: string;
  residencyStatus: ResidencyStatus;
  buyerRole: BuyerRole;
  countryPreference: CountryCode;
  monthlyGrossIncome: number;
  existingMonthlyDebts: number;
  defaultCurrency: string;
  currencyPreference?: 'AUTO' | 'MYR' | 'SGD' | string;
}

export type NavTab = 'search' | 'sightview' | 'saved' | 'cases' | 'account';

export interface GroundedNewsItem {
  id?: string;
  title: string;
  source: string;
  url: string;
  date?: string;
  category: 'Regulatory' | 'Court / Tribunal' | 'Project Delivery' | 'Financial' | 'Infrastructure' | 'Masterplan' | 'Zoning';
  sentiment: 'positive' | 'neutral' | 'watchout';
  snippet: string;
}

export interface GroundedDeveloperAuditResult {
  developer: string;
  reputationScore: string;
  completedProjectsCount: string;
  averageDelayMonths: string;
  regulatoryNotices: string;
  warrantyAssessment: string;
  summary: string;
  groundedNews: GroundedNewsItem[];
  searchQueries?: string[];
  lastAuditedAt: string;
}

export interface GroundedFutureProjectsResult {
  location: string;
  summary: string;
  infrastructureItems: Array<{
    name: string;
    type: 'Transit Line' | 'Highway' | 'Commercial Masterplan' | 'Zoning Corridor';
    status: 'Under Construction' | 'Approved Gazetted' | 'Proposed';
    impact: string;
    sourceTitle?: string;
    sourceUrl?: string;
  }>;
  groundedNews: GroundedNewsItem[];
  searchQueries?: string[];
  lastAuditedAt: string;
}

export interface ChecklistChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedAction?: string;
}

export interface SiteVisitTranscriptEntry {
  id: string;
  speaker: 'user' | 'ai';
  text: string;
  timestamp: string;
  severity?: string;
  detectedDefect?: string;
  statutoryReference?: string;
}
