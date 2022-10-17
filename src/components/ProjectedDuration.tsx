import React, { useEffect, useState } from 'react'
import { analyzeEstimateData, EstimateAnalysis, EstimateAnalysisSettings } from '../data/analyzeEstimateData'
import { RiskBadge } from './RiskBadge'

interface ProjectedDurationProps {
  record: Aha.Feature
  settings: EstimateAnalysisSettings
}

export const ProjectedDuration = ({ record, settings }: ProjectedDurationProps) => {
  const [loading, setLoading] = useState(true)
  const [analysis, setAnalysis] = useState<EstimateAnalysis | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const data = await analyzeEstimateData(record, settings)
        setAnalysis(data)
      } catch (e) {
        console.warn(`Unable to load estimation data for ${record.id}`, e)
      } finally {
        setLoading(false)
      }
    })()
  }, [record])

  if (loading) {
    return <aha-spinner />
  }

  if (!analysis) {
    return <div className="ml-2" style={{ color: "var(--theme-accent-icon)" }}>Insufficient data</div>
  }

  return (
    <div className="ml-2">
      <div>
        <span>
          {analysis.duration.projected[0].toFixed(1)}d
          <span className="m-1">&mdash;</span>
          {analysis.duration.projected[1].toFixed(1)}d
        </span>
        <span className="ml-1">
          <aha-tooltip-default-trigger aria-describedby="projected-duration-tooltip"></aha-tooltip-default-trigger>
          <aha-tooltip id="projected-duration-tooltip">
            <span>
              Based on velocity of {analysis.velocity.team.toFixed(1)}p / day
              and {settings.estimateUncertainty}% estimate uncertainty.
            </span>
          </aha-tooltip>
        </span>
      </div>
      <div className="text-muted">
        <span className="mr-1">Time in progress so far: {analysis.timeInProgress.toFixed(1)}d</span>
        <small>
          <RiskBadge risk={analysis.risk} />
        </small>
      </div>
    </div>
  )
}