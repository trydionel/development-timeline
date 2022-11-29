import { statistics } from "./statistical"

function forecast(estimate, uncertainty, velocity, settings): ForecastAnalysis {
  const mean = estimate.value / velocity
  let ideal, projected, model: ForecastAnalysis['model']

  if (settings.fancyMath) {
    const stats = statistics(mean, uncertainty * mean) // Interpretation: 68% of records are completed within +/- (uncertainty * mean)

    model = 'LOGNORMAL'
    ideal = stats.median
    projected = stats.iqr
  } else {
    const lower = (estimate.value * (1 - uncertainty)) / velocity
    const upper = (estimate.value * (1 + uncertainty)) / velocity

    model = 'SIMPLE'
    ideal = mean
    projected = [lower, upper]
  }

  return {
    model,
    estimate,
    ideal,
    projected
  }
}

export function analyzeDuration(record: Aha.RecordUnion, performance: PerformanceAnalysis, settings: RecordAnalysisSettings): DurationAnalysis {
  let uncertainty = settings.estimateUncertainty / 100 // as percentage

  // Estimate
  let remainingEstimate = record.remainingEstimate
  let initialEstimate = record.originalEstimate
  if (!initialEstimate.value) {
    initialEstimate = record.initialEstimate
    uncertainty *= 2
  }

  if (!initialEstimate.value) {
    initialEstimate = {
      value: settings.defaultEstimate,
      units: 'POINTS',
      text: `${settings.defaultEstimate}p`
    }
    remainingEstimate = initialEstimate
  }

  // Use assignee velocity iff available, avg individual throughput if not
  let velocity
  if (performance) {
    const assignee = record.assignedToUser
    if (performance.velocity.teamMember && assignee) {
      velocity = performance.velocity.teamMember[assignee.id]
    }
    
    if (!velocity) {
      velocity = performance.velocity.individual
    }
  } else {
    velocity = settings.defaultVelocity
  }

  if (!velocity) {
    console.error("Unable to determine velocity", performance, settings)
  }

  return {
    velocity,
    initial: forecast(initialEstimate, uncertainty, velocity, settings),
    remaining: forecast(remainingEstimate, uncertainty, velocity, settings)
  }
}