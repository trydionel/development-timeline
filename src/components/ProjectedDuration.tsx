import React, { useEffect, useState } from 'react'
import { findTransitions, loadEstimationData } from '../data'

interface ProjectedDurationSettings {
  estimateUncertainty: number
}

interface ProjectedDurationProps {
  record: Aha.RecordUnion
  settings: ProjectedDurationSettings
}

export const ProjectedDuration = ({ record, settings }: ProjectedDurationProps) => {
  const [loading, setLoading] = useState(true)
  const [estimate, setEstimate] = useState(null)
  const [velocity, setVelocity] = useState(null)
  const [timeInProgress, setTimeInProgress] = useState(null)
  const uncertainty = settings.estimateUncertainty

  useEffect(() => {
    (async () => {
      try {
        const data = await loadEstimationData(record)
        setEstimate(data.feature.originalEstimate)

        const weeks = data.throughput.timeSeries
        const points = weeks.reduce((acc, s) => acc + s.originalEstimate, 0)
        const days = weeks.length * 7
        setVelocity(points / days)

        const transitions = findTransitions(data.transitions.raw)
        const milliseconds = transitions.filter(t => t.statusCategory === "IN_PROGRESS").reduce((acc, t) => acc + t.duration, 0)
        setTimeInProgress(milliseconds / 86_400_000)
      } catch (e) {
        console.warn(`Unable to load estimation data for ${record.id}`, e)
      } finally {
        setLoading(false)
      }
    })()
  }, [record])

  if (loading) return <aha-spinner />

  if (!estimate.value) return <div className="ml-1 text-muted">No estimate provided</div>

  const lower = estimate.value / (velocity * (1 + (uncertainty / 100)))
  const upper = estimate.value / (velocity * (1 - (uncertainty / 100)))
  return <span>{lower.toFixed(1)}d &mdash; {upper.toFixed(1)}d | {timeInProgress.toFixed(1)}d</span>
}