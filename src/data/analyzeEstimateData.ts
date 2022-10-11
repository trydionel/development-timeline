import { StatusTransition, findTransitions } from "./findTransitions"
import { loadEstimationData } from "./loadEstimationData"

interface EstimateAnalysisSettings {
  estimateUncertainty: number
}

export interface EstimateAnalysis {
  estimate: Aha.Estimate
  velocity: number
  timeInProgress: number
  transitions: StatusTransition[],
  projectedDuration: [number, number],
  risk: 'NOT_STARTED' | 'ON_TRACK' | 'NEARING_ESTIMATE' | 'EXCEEDING_ESTIMATE'
}

export async function analyzeEstimateData(record: Aha.Feature, settings: EstimateAnalysisSettings): Promise<EstimateAnalysis | null> {
  const data = await loadEstimationData(record)
  const uncertainty = settings.estimateUncertainty

  // Estimate
  const estimate = data.feature.originalEstimate
  if (!estimate.value) {
    return null
  }

  // Velocity
  const weeks = data.throughput.timeSeries
  if (weeks.length === 0) {
    return null
  }

  const points = weeks.reduce((acc, s) => acc + s.originalEstimate, 0)
  const days = weeks.length * 7
  const velocity = points / days

  // Time In Status
  const transitions = findTransitions(data.transitions.raw)
  let milliseconds = transitions.filter(t => t.statusCategory === "IN_PROGRESS").reduce((acc, t) => acc + t.duration, 0)
  // Include time spent in current status iff in progress
  if (data.feature.teamWorkflowStatus.internalMeaning === 'IN_PROGRESS') {
    const last = transitions[transitions.length - 1]
    const duration = +new Date() - Date.parse(last.timestamp)
    milliseconds += duration
  }
  const timeInProgress = milliseconds / 86_400_000

  // Projected duration
  const lower = estimate.value / (velocity * (1 + (uncertainty / 100)))
  const upper = estimate.value / (velocity * (1 - (uncertainty / 100)))

  // Risk
  let risk: EstimateAnalysis['risk']
  if (timeInProgress === 0) {
    risk = 'NOT_STARTED'
  } else if (timeInProgress < lower) {
    risk = 'ON_TRACK'
  } else if (timeInProgress > lower && timeInProgress < upper) {
    risk = 'NEARING_ESTIMATE'
  } else if (timeInProgress > upper) {
    risk = 'EXCEEDING_ESTIMATE'
  }

  return {
    estimate,
    velocity,
    transitions,
    timeInProgress,
    projectedDuration: [lower, upper],
    risk
  }
}