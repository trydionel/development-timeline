import lognormal from '@stdlib/stats-base-dists-lognormal'

interface EstimateStatistics {
  mean: number
  stdev: number
  median: number
  iqr: [number, number]
}

export function statistics(mean, stddev) : EstimateStatistics {
  const meanSq = Math.pow(mean, 2)
  const stddevSq = Math.pow(stddev, 2)

  // See https://en.wikipedia.org/wiki/Log-normal_distribution#Generation_and_parameters
  const mu = Math.log(meanSq / Math.sqrt(meanSq + stddevSq))
  const sigma = Math.sqrt(Math.log(1 + stddevSq / meanSq))

  return {
    mean: lognormal.mean(mu, sigma),
    stdev: lognormal.stdev(mu, sigma),
    median: lognormal.median(mu, sigma),
    iqr: [
      lognormal.quantile(0.25, mu, sigma),
      lognormal.quantile(0.75, mu, sigma)
    ]
  }
}