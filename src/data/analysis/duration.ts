import { DurationAnalysis, EstimateAnalysisSettings, PerformanceAnalysis } from "../analyzeEstimateData"
import { statistics } from "./statistical"

export function analyzeDuration(record: Aha.RecordUnion, performance: PerformanceAnalysis, settings: EstimateAnalysisSettings): DurationAnalysis {
  const uncertainty = settings.estimateUncertainty / 100 // as percentage

  // Estimate
  let estimate = record.originalEstimate
  if (!estimate.value) {
    estimate = {
      value: settings.defaultEstimate,
      units: 'POINTS',
      text: `${settings.defaultEstimate}p`
    }
  }

  // Use assignee velocity iff available, avg individual throughput if not
  const velocity = performance ? (performance.velocity.teamMember[record.assignedToUser.id] || performance.velocity.individual) : settings.defaultVelocity
  if (!velocity) {
    console.error(performance, settings)
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