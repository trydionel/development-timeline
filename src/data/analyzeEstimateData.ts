import { differenceInBusinessDays } from "date-fns"
import { analyzeDuration } from "./analysis/duration"
import { simulateReleasePlanning } from "./analysis/monteCarlo"
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

  const totalEstimate = data.features.reduce((sum, f) => sum + (f.remainingEstimate.value), 0)
  const estimate: Aha.Estimate = {
    value: totalEstimate,
    units: 'POINTS',
    text: `${totalEstimate}p`
  }

  // Analyze duration of each feature according to assigned team
  const durations = data.features.map(f => {
    const teamId = f.teamId
    return analyzeDuration(f, performance[teamId], settings)
  })

  // Monte Carlo simulation!
  const N = 1000;
  const ptile = (arr, p) => arr[Math.floor(arr.length * p)]
  const simulations = Array(N).fill(0).map(() => {
    return simulateReleasePlanning(durations, settings)
  }).sort((a, b) => a - b)

  const duration: DurationAnalysis = {
    remaining: {
      model: settings.fancyMath ? 'LOGNORMAL' : 'SIMPLE',
      estimate,
      ideal: ptile(simulations, 0.5),
      projected: [
        ptile(simulations, 0.25),
        ptile(simulations, 0.75)
      ],
    },
    velocity: 0
  }

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