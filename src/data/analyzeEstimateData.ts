import { analyzeProgress, StatusTransition } from "./analysis/progress"
import { statistics } from "./analysis/statistical"
import { loadEstimationData } from "./loadEstimationData"

const HOURS_IN_WORKDAY = 8
const WORKDAYS_IN_WEEK = 5

export interface EstimateAnalysisSettings {
  estimateUncertainty: number
  fancyMath: boolean
}

export interface EstimateAnalysis {
  model: 'SIMPLE' | 'LOGNORMAL'
  estimate: Aha.Estimate
  velocity: Record<string, number>
  timeInProgress: number
  transitions: StatusTransition[]
  duration: {
    ideal: number
    projected: [number, number]
  }
  risk: 'NOT_STARTED' | 'ON_TRACK' | 'NEARING_ESTIMATE' | 'EXCEEDING_ESTIMATE'
}

export async function analyzeEstimateData(record: Aha.RecordUnion, settings: EstimateAnalysisSettings): Promise<EstimateAnalysis | null> {
  const data = await loadEstimationData(record)
  const uncertainty = settings.estimateUncertainty / 100 // as percentage

  // Estimate
  const estimate = data.record.originalEstimate
  if (!estimate.value) {
    return null
  }

  // Velocity: team and individual
  const weeks = data.throughput.timeSeries
  if (weeks.length === 0) {
    return null
  }

  const velocity = data.project.currentIteration.teamMembers.reduce((acc, t) => {
    acc[t.user.id] = t.storyPoints / (t.workingHours / HOURS_IN_WORKDAY)
    return acc
  }, {})
  const points = weeks.reduce((acc, s) => acc + s.originalEstimate, 0)
  const days = weeks.length * WORKDAYS_IN_WEEK
  const team = points / days
  velocity['team'] = team

  // Projected duration
  // Use assignee velocity iff available, team throughput if not
  const assigneeVelocity = velocity[data.record.assignedToUser.id] || velocity['team']
  const mean = estimate.value / assigneeVelocity
  let ideal, projected, model : EstimateAnalysis['model']
  if (settings.fancyMath) {
    const stats = statistics(mean, uncertainty * mean) // Interpretation: 68% of records are completed within +/- (uncertainty * mean)

    model = 'LOGNORMAL'
    ideal = stats.median
    projected = stats.iqr
  } else {
    const lower = (estimate.value * (1 - uncertainty)) / assigneeVelocity
    const upper = (estimate.value * (1 + uncertainty)) / assigneeVelocity

    model = 'SIMPLE'
    ideal = mean
    projected = [lower, upper]
  }

  // Time In Status
  const { transitions, timeInProgress } = analyzeProgress(data.transitions.raw)

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