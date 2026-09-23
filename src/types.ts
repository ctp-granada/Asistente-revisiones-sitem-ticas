/**
 * Tipos y estructuras de datos para el Asistente Metodológico PRISMA 2020
 */

export interface PicoData {
  population: string;
  intervention: string;
  comparator: string;
  outcomes: string;
  studyDesign: string;
  timeframe: string;
  clinicalQuestion: string;
}

export type PrismaSectionKey = 
  | 'title-abstract'
  | 'introduction'
  | 'methods'
  | 'results'
  | 'discussion'
  | 'other';

export interface PrismaChecklistItem {
  itemNumber: string; // e.g. "1", "10a", "13d", "24a"
  section: 'TITLE' | 'ABSTRACT' | 'INTRODUCTION' | 'METHODS' | 'RESULTS' | 'DISCUSSION' | 'OTHER';
  topic: string;
  title: string;
  essentialElements: string[];
  additionalElements?: string[];
  locationReported: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'not_applicable';
  notes: string;
}

export interface ExclusionReason {
  id: string;
  reason: string;
  count: number;
}

export interface FlowDiagramState {
  databasesIdentified: Array<{ id: string; name: string; count: number }>;
  registersIdentified: Array<{ id: string; name: string; count: number }>;
  duplicatesRemoved: number;
  automationExcludedPreScreening: number;
  otherRemovedPreScreening: number;
  recordsScreened: number;
  recordsExcludedScreening: number;
  reportsSought: number;
  reportsNotRetrieved: number;
  reportsAssessed: number;
  reportsExcludedReasons: ExclusionReason[];
  newStudiesIncluded: number;
  newReportsIncluded: number;
  // Other methods
  otherSourcesIdentified: Array<{ id: string; name: string; count: number }>;
  otherReportsSought: number;
  otherReportsNotRetrieved: number;
  otherReportsAssessed: number;
  otherReportsExcludedReasons: ExclusionReason[];
  otherStudiesIncluded: number;
  // Totals
  previousStudiesCount: number;
  totalStudiesIncluded: number;
  totalReportsIncluded: number;
}

export interface ManuscriptSection {
  id: PrismaSectionKey;
  title: string;
  subtitle: string;
  prismaItemNumbers: string[];
  content: string;
  isConfirmed: boolean;
  notes: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sectionContext?: PrismaSectionKey;
  missingDataInquiry?: string[];
  suggestedPrompts?: string[];
}

export type GradeCertaintyLevel = 'high' | 'moderate' | 'low' | 'very_low';

export interface GradeDomainAssessment {
  level: number; // 0, -1, -2 for downgrade; 0, +1, +2 for upgrade
  justification: string;
}

export interface GradeOutcomeAssessment {
  id: string;
  outcomeName: string;
  importance: 'critical' | 'important';
  studyType: 'rct' | 'observational'; // RCT starts at 4 (High), Observational starts at 2 (Low)
  studyCount: number;
  participantCount: number;
  effectEstimate: string; // e.g. "RR 0.74 (95% CI: 0.65 - 0.85)"
  baselineRisk?: string; // e.g. "150 por 1,000"
  interventionRisk?: string; // e.g. "111 por 1,000"
  riskDifference?: string; // e.g. "39 menos por 1,000"
  // 5 Downgrade domains
  riskOfBias: GradeDomainAssessment;
  inconsistency: GradeDomainAssessment;
  indirectness: GradeDomainAssessment;
  imprecision: GradeDomainAssessment;
  publicationBias: GradeDomainAssessment;
  // 3 Upgrade domains
  largeEffect: GradeDomainAssessment;
  doseResponse: GradeDomainAssessment;
  residualConfounding: GradeDomainAssessment;
  // Calculated certainty
  overallCertainty: GradeCertaintyLevel;
  informativeStatement: string;
  footnotes: string[];
}

export type MetaAnalysisModelType = 
  | 'random_dersimonian_laird' 
  | 'random_reml' 
  | 'random_paule_mandel' 
  | 'fixed_inverse_variance' 
  | 'fixed_mantel_haenszel';

export interface MetaRegressionCovariate {
  id: string;
  name: string;
  type: 'continuous' | 'categorical';
  unit?: string;
  beta: number;
  se: number;
  ciLower: number;
  ciUpper: number;
  pValue: number;
  r2Analog: number; // percentage of between-study variance explained (%)
  description?: string;
}

export interface MetaAnalysisConfigState {
  id: string;
  outcomeName: string;
  effectMeasure: 'RR' | 'OR' | 'HR' | 'MD' | 'SMD';
  modelType: MetaAnalysisModelType;
  knappHartungAdjustment: boolean;
  continuityCorrection: boolean;
  
  // Heterogeneity parameters (Item 13d / 20)
  studyCount: number;
  totalParticipants: number;
  qStatistic: number;
  qPValue: number;
  i2: number;
  tau2: number;
  tau: number;
  predictionIntervalLower: number;
  predictionIntervalUpper: number;

  // Pooled estimate
  pooledEstimate: number;
  ciLower: number;
  ciUpper: number;
  pValue: number;

  // Meta-regression parameters (Item 13e / 20)
  metaRegressionEnabled: boolean;
  metaRegressionMethod: 'REML' | 'DerSimonian-Laird';
  covariates: MetaRegressionCovariate[];
}

export type RobJudgment = 'low' | 'some_concerns' | 'high';

export type SensitivityPreset = 
  | 'all' 
  | 'exclude_high_rob' 
  | 'exclude_high_and_some_concerns' 
  | 'exclude_small_sample' 
  | 'leave_one_out' 
  | 'custom';

export interface SensitivityAnalysisResult {
  preset: SensitivityPreset;
  presetLabel: string;
  includedCount: number;
  excludedCount: number;
  totalN: number;
  pooledEstimate: number;
  ciLower: number;
  ciUpper: number;
  i2: number;
  qStatistic: number;
  tau2: number;
  pValue: number;
  isRobust: boolean;
  deltaEstimate: number;
  deltaI2: number;
  excludedStudies: string[];
}

export interface Rob2StudyAssessment {
  id: string;
  studyName: string;
  year: number;
  sampleSize: number;
  d1Randomization: RobJudgment;
  d2Deviations: RobJudgment;
  d3MissingData: RobJudgment;
  d4Measurement: RobJudgment;
  d5ReportedResult: RobJudgment;
  overall: RobJudgment;
  notes?: string;
}

export type AcademicFormatStyle = 'biomedical_icmje' | 'apa7';

export interface ManuscriptExportMetadata {
  title: string;
  runningHead: string;
  authors: string;
  affiliations: string;
  correspondingAuthor: string;
  correspondingEmail: string;
  prosperoRegistration: string;
  fundingStatement: string;
  conflictsOfInterest: string;
  keywords: string;
}

/**
 * Matriz de Evidencia estandarizada de extracción de datos (Ítems 10a, 10b y 17 PRISMA 2020)
 */
export interface EvidenceStudyRecord {
  id: string;
  fileName?: string;
  authorAndYear: string; // Autor y Año
  studyDesignAndSampleSize: string; // Diseño del estudio y tamaño de la muestra (N)
  population: string; // Población (Criterios de inclusión/exclusión)
  interventionComparator: string; // Intervención / Comparador
  mainResults: string; // Resultados principales (Outcomes primarios con sus valores estadísticos: p, IC 95%, OR/RR si aplican)
  authorConclusion: string; // Conclusión principal del autor
  isExtractedWithAi?: boolean;
  extractedAt?: string;
  rawTextSnippet?: string;
}

/**
 * Identificador y Armonizador de Variables y Desenlaces (Ítems 10b, 13a-f, 17 PRISMA 2020)
 */
export type OutcomeCategory = 'primary' | 'secondary' | 'safety' | 'subgroup';
export type OutcomeVariableType = 'time_to_event' | 'dichotomous' | 'continuous';
export type OutcomeEffectMeasure = 'HR' | 'RR' | 'OR' | 'MD' | 'SMD' | 'RD';

export interface OutcomeStudyMapping {
  studyId: string;
  studyName: string; // ej. "McMurray et al., 2019 (DAPA-HF)"
  reported: boolean;
  reportedText: string; // ej. "HR 0.74 (IC 95%: 0.65-0.85), p < 0.001"
  numericEstimate?: number;
  ciLower?: number;
  ciUpper?: number;
  sampleSize?: number;
  isEligibleForMetaAnalysis: boolean;
  extractedNotes?: string;
}

export interface CandidateOutcome {
  id: string;
  name: string;
  domain: string;
  category: OutcomeCategory;
  variableType: OutcomeVariableType;
  preferredEffectMeasure: OutcomeEffectMeasure;
  clinicalDefinition: string;
  measurementTimepoint: string;
  importance: 'critical' | 'important';
  cosAlignment?: string; // Alineación con Core Outcome Set (COMET)
  studiesMapping: OutcomeStudyMapping[];
  synthesisEligibility: {
    eligibleStudiesCount: number;
    canMetaAnalyze: boolean;
    recommendedSynthesis: 'meta_analysis_random' | 'meta_analysis_fixed' | 'narrative_synthesis';
    methodologicalJustification: string;
  };
}

