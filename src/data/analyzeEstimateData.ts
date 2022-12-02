import { differenceInBusinessDays } from "date-fns"
import { analyzeDuration } from "./analysis/duration"
import { monteCarlo, simulatePlanning } from "./analysis/monteCarlo"
import { analyzePerformance } from "./analysis/performance"
import { analyzeProgress } from "./analysis/progress"

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

export function analyzeFeature(data: FeatureDataResponse, settings: RecordAnalysisSettings): (FeatureAnalysis | null) {
  const record = data.record

  // Analyze performance for each team
  const performance = {} 
  Object.keys(data.performance).forEach(teamId => {
    performance[teamId] = analyzePerformance(data.performance[teamId], settings)
  })

  // Analyze duration of each requirement according to assigned team (if any)
  let duration
  if (data.requirements.length > 0) {
    const durations = data.requirements.map(req => {
      const teamId = req.teamId
      return analyzeDuration(req, performance[teamId], settings)
    })
    duration = monteCarlo(durations, settings)
  } else {
    duration = analyzeDuration(record, performance[record.teamId], settings)
  }

  let progress = null
  if (settings.analyzeProgress) {
    progress = analyzeProgress(data, duration, settings)
  }

  return {
    record: record as Aha.Feature,
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

  // Analyze duration of each feature according to assigned team
  const durations = data.features.map(f => {
    const teamId = f.teamId
    return analyzeDuration(f, performance[teamId], settings)
  })

  // Monte Carlo simulation!
  const duration = monteCarlo(durations, settings)

  // Analyze target release date against remaining work
  const target = data.releaseDate
  const daysRemaining = differenceInBusinessDays(Date.parse(target), new Date())
  let risk: RiskLabel
  if (daysRemaining > duration.remaining.projected[0]) {
    risk = 'EARLY'
  } else if (daysRemaining < duration.remaining.projected[1]) {
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
    duration,
    settings
  }
}