import { statistics } from "./analysis/statistical"
import { StatusTransition, findTransitions } from "./findTransitions"
import { loadEstimationData } from "./loadEstimationData"

export interface EstimateAnalysisSettings {
  estimateUncertainty: number
  fancyMath: boolean
}

export interface EstimateAnalysis {
  model: 'SIMPLE' | 'LOGNORMAL'
  estimate: Aha.Estimate
  velocity: number
  timeInProgress: number
  transitions: StatusTransition[]
  duration: {
    ideal: number
    projected: [number, number]
  }
  risk: 'NOT_STARTED' | 'ON_TRACK' | 'NEARING_ESTIMATE' | 'EXCEEDING_ESTIMATE'
}

export async function analyzeEstimateData(record: Aha.Feature, settings: EstimateAnalysisSettings): Promise<EstimateAnalysis | null> {
  const data = await loadEstimationData(record)
  const uncertainty = settings.estimateUncertainty / 100 // as percentage

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
  const ideal = estimate.value / velocity
  let projected, model : EstimateAnalysis['model']
  if (settings.fancyMath) {
    const stats = statistics(ideal, uncertainty * ideal) // FIXME: not sure if this is right for stdev!

    model = 'LOGNORMAL'
    projected = stats.iqr
  } else {
    const lower = estimate.value / (velocity * (1 + uncertainty))
    const upper = estimate.value / (velocity * (1 - uncertainty))

    model = 'SIMPLE'
    projected = [lower, upper]
  }

  // Risk
  let risk: EstimateAnalysis['risk']
  if (timeInProgress === 0) {
    risk = 'NOT_STARTED'
  } else if (timeInProgress < projected[0]) {
    risk = 'ON_TRACK'
  } else if (timeInProgress > projected[0] && timeInProgress < projected[1]) {
    risk = 'NEARING_ESTIMATE'
  } else if (timeInProgress > projected[1]) {
    risk = 'EXCEEDING_ESTIMATE'
  }

  return {
    model,
    estimate,
    velocity,
    transitions,
    timeInProgress,
    duration: {
      ideal,
      projected
    },
    risk
  }
}