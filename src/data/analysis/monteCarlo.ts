import lognormal from '@stdlib/random-base-lognormal'
import { DurationAnalysis, ReleaseAnalysisSettings } from '../analyzeEstimateData'

function sum(acc, v) {
  return acc + v
}

function rand(a, b) {
  return Math.random() * (b - a) + a
}

export function simulate(mean, stddev, N = 1000) {
  const mu = Math.log(mean)
  const sigma = 0.25 // uncertainty??

  const samples = Array(N).fill(0).map(() => lognormal(mu, sigma)).sort()
  const min = Math.min(...samples)
  const max = Math.max(...samples)
  const range = max - min
  const avg = samples.reduce(sum, 0) / N
  const median = samples[N / 2]
  const iqr = samples[3 * N / 4] - samples[N / 4]
  
  const bins = 50
  const binSize = range / bins
  const histogram = Array(bins).fill(0)

  let bin = 0
  let threshold = 0
  for (let i = 0; i < N; i++) {
    const sample = samples[i]

    while (sample >= threshold) {
      bin++
      threshold = bin * binSize
    }

    histogram[bin]++
  }

  
  return {
    samples,
    max,
    min,
    range,
    avg,
    median,
    iqr,
    histogram
  }
}

export function simulateReleasePlanning(features: DurationAnalysis[], settings: ReleaseAnalysisSettings) {
  const { estimateUncertainty, totalAssignees } = settings

  // Aggregate durations according to the number of team members working on the release
  const plans = Array(totalAssignees).fill(0)
  features.forEach(duration => {
    // Find the assignee that has spent the least time working so far
    const minPlan = Math.min(...plans)
    const assigneeIndex = plans.findIndex(p => Math.abs(p - minPlan) < 0.00001) // wheee floating points

    // Sample a completion time for the record
    let sample
    if (settings.fancyMath) {
      const mean = duration.ideal
      const stdev = duration.ideal * estimateUncertainty // Interpretation: 68% of records are completed within +/- (uncertainty * mean)
      const meanSq = Math.pow(mean, 2)
      const stdevSq = Math.pow(stdev, 2)
      const mu = Math.log(meanSq / Math.sqrt(meanSq + stdevSq))
      const sigma = Math.sqrt(Math.log(1 + stdevSq / meanSq))
      sample = lognormal(mu, sigma)
    } else {
      sample = rand(...duration.projected)
    }

    if (!sample) {
      console.error(duration, plans, minPlan, sample, settings)
      throw new Error('Unable to sample release duration')
    }

    // Allocate it to the assignee that will end up with the minimal time spent
    if (assigneeIndex === -1) {
      console.error(duration, plans, minPlan)
      throw new Error('Unable to allocate work to an individual')
    }
    plans[assigneeIndex] += sample
  })

  return Math.min(...plans)
}