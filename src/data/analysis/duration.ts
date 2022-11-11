import { DurationAnalysis, RecordAnalysisSettings, PerformanceAnalysis } from "../analyzeEstimateData"
import { statistics } from "./statistical"

export function analyzeDuration(record: Aha.RecordUnion, performance: PerformanceAnalysis, settings: RecordAnalysisSettings): DurationAnalysis {
  let uncertainty = settings.estimateUncertainty / 100 // as percentage

  // Estimate
  let estimate
  if (settings.estimateField === 'REMAINING') {
    estimate = record.remainingEstimate
  } else {
    if (record.originalEstimate.value) {
      estimate = record.originalEstimate
    } else {
      estimate = record.initialEstimate
      uncertainty *= 2
    }
  }
  if (!estimate.value) {
    estimate = {
      value: settings.defaultEstimate,
      units: 'POINTS',
      text: `${settings.defaultEstimate}p`
    }
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

  const mean = estimate.value / velocity
  let ideal, projected, model: DurationAnalysis['model']
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
    velocity,
    ideal,
    projected
  }
}