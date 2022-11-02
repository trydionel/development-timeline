import { analyzeDuration } from "./analysis/duration"
import { simulateReleasePlanning } from "./analysis/monteCarlo"
import { analyzePerformance } from "./analysis/performance"
import { analyzeProgress, StatusTransition } from "./analysis/progress"
import { RecordDataRespose, ReleaseDataRespose } from "./loadEstimationData"

export interface EstimateAnalysisSettings {
  estimateUncertainty: number
  fancyMath: boolean
  totalAssignees: number
  defaultEstimate: number
  defaultVelocity: number
  analyzeProgress: boolean
}

export interface PerformanceAnalysis {
  teamId: string,
  totalMembers: number,
  velocity: {
    team: number
    individual: number,
    teamMember?: Record<string, number>
  }
}

export interface DurationAnalysis {
  model: 'SIMPLE' | 'LOGNORMAL'
  estimate: Aha.Estimate
  velocity: number
  ideal: number
  projected: [number, number]
}

export interface ProgressAnalysis {
  timeInProgress: number
  transitions: StatusTransition[]
  risk: 'NOT_STARTED' | 'ON_TRACK' | 'NEARING_ESTIMATE' | 'EXCEEDING_ESTIMATE'
}

export interface RecordAnalysis {
  record: Aha.RecordUnion
  performance: PerformanceAnalysis
  duration: DurationAnalysis
  progress?: ProgressAnalysis
  settings: EstimateAnalysisSettings
}

export interface ReleaseAnalysis {
  performance: Record<string, PerformanceAnalysis>
  features: DurationAnalysis[]
  duration: DurationAnalysis
  settings: EstimateAnalysisSettings
}

export function analyzeSingleRecord(data: RecordDataRespose, settings: EstimateAnalysisSettings): (RecordAnalysis | null) {
  const record = data.record
  const performance = analyzePerformance(data, settings)
  const duration = analyzeDuration(record, performance, settings)

  let progress = null
  if (settings.analyzeProgress) {
    progress = analyzeProgress(data, duration, settings)
  }

  return {
    record,
    performance,
    progress,
    duration,
    settings
  }
}

export function analyzeRelease(data: ReleaseDataRespose, settings: EstimateAnalysisSettings): (ReleaseAnalysis | null) {
  // TODO:
  // * Order by product value score
  // * Schedule dependant work appropriately
  // * Ensure work assigned to the team stays on that team
  // * Ensure assignees have only one WIP
  // * Monte Carlo simulation!

  // Analyze performance for each team
  const performance = {} 
  Object.keys(data.performance).forEach(teamId => {
    performance[teamId] = analyzePerformance(data.performance[teamId], settings)
  })

  // Roll up feature estimates for debugging
  const totalEstimate = data.features.nodes.reduce((sum, f) => sum + f.originalEstimate.value, 0)
  const estimate: Aha.Estimate = {
    value: totalEstimate,
    units: 'POINTS',
    text: `${totalEstimate}p`
  }

  // Analyze duration of each feature according to assigned team
  const features = data.features.nodes.map(f => {
    const teamId = f.teamId
    return analyzeDuration(f, performance[teamId], settings)
  })

  const N = 1000;
  const ptile = (arr, p) => arr[Math.floor(arr.length * p)]
  const simulations = Array(N).fill(0).map(() => {
    return simulateReleasePlanning(features, settings)
  }).sort((a, b) => a - b)

  const duration: DurationAnalysis = {
    model: settings.fancyMath ? 'LOGNORMAL' : 'SIMPLE',
    estimate,
    ideal: ptile(simulations, 0.5),
    projected: [
      ptile(simulations, 0.25),
      ptile(simulations, 0.75)
    ],
    velocity: 0
  }

  return {
    performance,
    features,
    duration,
    settings
  }
}