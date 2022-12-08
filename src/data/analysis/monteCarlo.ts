import lognormal from '@stdlib/random-base-lognormal'

function sum(acc, v) {
  return acc + v
}

function rand(a, b) {
  return Math.random() * (b - a) + a
}

function percentile(arr, p) {
  return arr[Math.floor(arr.length * p)]
}

export function monteCarlo(durations: DurationAnalysis[], settings, N = 1000): DurationAnalysis {
  const totalEstimate = durations.reduce((sum, d) => sum + (d.remaining.estimate.value), 0)
  const estimate: Aha.Estimate = {
    value: totalEstimate,
    units: 'POINTS',
    text: `${totalEstimate}p`
  }
  const velocity = durations.map(d => d.velocity).reduce(sum) / durations.length

  const simulations = Array(N).fill(0).map(() => {
    return simulatePlanning(durations, settings)
  }).sort((a, b) => a - b)

  return {
    remaining: {
      model: settings.fancyMath ? 'LOGNORMAL' : 'SIMPLE',
      estimate,
      ideal: percentile(simulations, 0.5),
      projected: [
        percentile(simulations, 0.25),
        percentile(simulations, 0.75)
      ],
    },
    basis: 'TEAM',
    velocity: velocity
  }
}

export function simulatePlanning(durations: DurationAnalysis[], settings: ReleaseAnalysisSettings) {
  const { estimateUncertainty, totalAssignees } = settings

  // Aggregate durations according to the number of team members working on the release
  const plans = Array(totalAssignees).fill(0)
  durations.forEach(duration => {
    // Find the assignee that has spent the least time working so far
    const minPlan = Math.min(...plans)
    const assigneeIndex = plans.findIndex(p => Math.abs(p - minPlan) < 0.00001) // wheee floating points

    // Sample a completion time for the record
    let sample
    if (settings.fancyMath) {
      const mean = duration.remaining.ideal
      const stdev = duration.remaining.ideal * estimateUncertainty // Interpretation: 68% of records are completed within +/- (uncertainty * mean)
      const meanSq = Math.pow(mean, 2)
      const stdevSq = Math.pow(stdev, 2)
      const mu = Math.log(meanSq / Math.sqrt(meanSq + stdevSq))
      const sigma = Math.sqrt(Math.log(1 + stdevSq / meanSq))
      sample = lognormal(mu, sigma)
    } else {
      sample = rand(...duration.remaining.projected)
    }

    if (typeof sample !== 'number') {
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