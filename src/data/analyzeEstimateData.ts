import { differenceInBusinessDays } from "date-fns"
import { analyzeDuration } from "./analysis/duration"
import { simulateReleasePlanning } from "./analysis/monteCarlo"
import { analyzePerformance } from "./analysis/performance"
import { analyzeProgress, StatusTransition } from "./analysis/progress"
import { RecordDataRespose, ReleaseDataRespose } from "./loadEstimationData"

export type EstimateField = 'INITIAL' | 'ORIGINAL' | 'REMAINING'
export type RiskLabel = 'NOT_STARTED' | 'EARLY' | 'ON_TRACK' | 'NEARING' | 'EXCEEDING'

export interface CoreEstimateAnalysisSettings {
  estimateUncertainty: number
  fancyMath: boolean
  defaultEstimate: number
  defaultVelocity: number
  analyzeProgress: boolean
  estimateField: EstimateField
}

export interface RecordAnalysisSettings extends CoreEstimateAnalysisSettings {
}

export interface ReleaseAnalysisSettings extends CoreEstimateAnalysisSettings {
  totalAssignees: number
}

export type AnalysisSettingsUnion = (RecordAnalysisSettings | ReleaseAnalysisSettings)

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
  risk: RiskLabel 
}

export interface RecordAnalysis {
  record: Aha.RecordUnion
  performance: PerformanceAnalysis
  duration: DurationAnalysis
  progress?: ProgressAnalysis
  settings: RecordAnalysisSettings
}

export interface ReleaseAnalysis {
  performance: Record<string, PerformanceAnalysis>
  date: {
    target: string
    daysRemaining: number,
    risk: RiskLabel
  }
  original: {
    features: DurationAnalysis[]
    duration: DurationAnalysis
  }
  remaining: {
    features: DurationAnalysis[]
    duration: DurationAnalysis
  }
  settings: ReleaseAnalysisSettings
}

export function analyzeSingleRecord(data: RecordDataRespose, settings: RecordAnalysisSettings): (RecordAnalysis | null) {
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

export function analyzeRelease(data: ReleaseDataRespose, settings: ReleaseAnalysisSettings): (ReleaseAnalysis | null) {
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

  // Analyze both original and remaining estimates
  const analyzeEstimateField = (estimateField: EstimateField) => {
    // Roll up feature estimates for debugging
    const totalEstimate = data.features.reduce((sum, f) => sum + (estimateField === 'REMAINING' ? f.remainingEstimate.value : f.originalEstimate.value), 0)
    const estimate: Aha.Estimate = {
      value: totalEstimate,
      units: 'POINTS',
      text: `${totalEstimate}p`
    }

    // Analyze duration of each feature according to assigned team
    const features = data.features.map(f => {
      const teamId = f.teamId
      return analyzeDuration(f, performance[teamId], { ...settings, estimateField })
    })

    // Monte Carlo simulation!
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
      features,
      duration
    }
  }
  const original = analyzeEstimateField('ORIGINAL')
  const remaining = analyzeEstimateField('REMAINING')

  // Analyze target release date against remaining work
  const target = data.releaseDate
  const daysRemaining = differenceInBusinessDays(Date.parse(target), new Date())
  let risk: RiskLabel
  if (daysRemaining > remaining.duration.projected[0]) {
    risk = 'EARLY'
  } else if (daysRemaining < remaining.duration.projected[1]) {
    risk = 'EXCEEDING'
  } else {
    risk = 'ON_TRACK'
  }

  return {
    performance,
    date: {
      target,
      daysRemaining,
      risk
    },
    original,
    remaining,
    settings
  }
}