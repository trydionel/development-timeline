/**
 * Network response types
 */

interface EstimatationDataRespose {
  record: Aha.RecordUnion
  transitions: {
    raw: Aha.RecordEventRaw[]
  }
}

interface PerformanceDataResponse {
  velocity?: {
    timeSeries: any[] // No pre-defined type for this?
  }
  throughput?: {
    timeSeries: any[] // No pre-defined type for this?
  }
  project?: Aha.Project
  users?: {
    totalCount: number
  }
}

interface RelatedFeaturesResponse {
  features: {
    nodes: Aha.Feature[]
    totalCount: number
  }
  releases: {
    nodes: Aha.Release[]
  }
}

interface FeatureRequirementsResponse {
  feature: {
    requirements: Aha.Requirement[]
  }
}

type RecordDataRespose = EstimatationDataRespose & PerformanceDataResponse & {
  // children?: Aha.RecordUnion[]
}

interface FeatureDataResponse extends EstimatationDataRespose {
  record: Aha.Feature
  requirements: Aha.Requirement[]
  performance: Record<string, PerformanceDataResponse>
}

interface ReleaseDataRespose {
  features: Aha.Feature[],
  performance: Record<string, PerformanceDataResponse>
  releaseDate: string
}

/**
 * Analysis types
 */

type EstimateField = 'INITIAL' | 'ORIGINAL' | 'REMAINING'
type RiskLabel = 'NOT_STARTED' | 'EARLY' | 'ON_TRACK' | 'NEARING' | 'EXCEEDING' | 'UNKNOWN'

interface StatusAssignment {
  id: string
  timestamp: Date
  team: string
  status: string
  category: Aha.WorkflowStatusAttributes['internalMeaning']
  color: string
}

interface StatusTransition {
  duration: number
  from?: StatusAssignment
  to?: StatusAssignment
}

interface CoreEstimateAnalysisSettings {
  estimateUncertainty: number
  fancyMath: boolean
  defaultEstimate: number
  defaultVelocity: number
  analyzeProgress: boolean
  startDate: string
}

interface RecordAnalysisSettings extends CoreEstimateAnalysisSettings {
}

interface ReleaseAnalysisSettings extends CoreEstimateAnalysisSettings {
  totalAssignees: number
}

type AnalysisSettingsUnion = (RecordAnalysisSettings | ReleaseAnalysisSettings)

interface PerformanceAnalysis {
  teamId: string,
  totalMembers: number,
  velocity: {
    team: number
    individual: number,
    teamMember?: Record<string, number>
  }
}

interface ForecastAnalysis {
  estimate: Aha.Estimate
  model: 'SIMPLE' | 'LOGNORMAL'
  ideal: number
  projected: [number, number]
}

interface DurationAnalysis {
  velocity: number
  initial?: ForecastAnalysis
  remaining: ForecastAnalysis
}

interface ProgressAnalysis {
  timeInProgress: number
  transitions: StatusTransition[]
  risk: RiskLabel 
}

interface RecordAnalysis {
  record: Aha.RecordUnion
  performance: PerformanceAnalysis
  duration: DurationAnalysis
  progress?: ProgressAnalysis
  settings: RecordAnalysisSettings
}

interface FeatureAnalysis {
  record: Aha.Feature
  performance: Record<string, PerformanceAnalysis>
  duration: DurationAnalysis
  progress: ProgressAnalysis
  settings: RecordAnalysisSettings
}

interface ReleaseAnalysis {
  performance: Record<string, PerformanceAnalysis>
  date: {
    target: string
    daysRemaining: number,
    risk: RiskLabel
  }
  duration: DurationAnalysis
  settings: ReleaseAnalysisSettings
}