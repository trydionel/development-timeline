/**
 * Network response types
 */
type TeamID = string

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
  performance: Record<TeamID, PerformanceDataResponse>
}

interface ReleaseDataRespose {
  features: Aha.Feature[],
  performance: Record<TeamID, PerformanceDataResponse>
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

interface FeatureAnalysisSettings extends CoreEstimateAnalysisSettings {
  totalAssignees: number
}

interface ReleaseAnalysisSettings extends CoreEstimateAnalysisSettings {
  totalAssignees: number
}

type AnalysisSettingsUnion = (RecordAnalysisSettings | FeatureAnalysisSettings | ReleaseAnalysisSettings)

interface PerformanceAnalysis {
  teamId: string,
  totalMembers: number,
  velocity: {
    team: number
    individual: number,
    teamMember?: Record<string, number>
  }
}

type TeamPerformanceMap = Record<TeamID, PerformanceAnalysis>

interface ForecastAnalysis {
  estimate: Aha.Estimate
  model: 'SIMPLE' | 'LOGNORMAL'
  ideal: number
  projected: [number, number]
}

interface DurationAnalysis {
  velocity: number
  basis: 'ASSIGNEE' | 'TEAM' | 'DEFAULT'
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
  performance: TeamPerformanceMap
  duration: DurationAnalysis
  progress: ProgressAnalysis
  settings: RecordAnalysisSettings
}

interface ReleaseAnalysis {
  performance: TeamPerformanceMap
  date: {
    target: string
    daysRemaining: number,
    risk: RiskLabel
  }
  duration: DurationAnalysis
  settings: ReleaseAnalysisSettings
}