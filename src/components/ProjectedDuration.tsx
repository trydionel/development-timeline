import React, { useEffect, useState } from 'react'
import { analyzeEstimateData } from '../data'
import { RiskBadge } from './RiskBadge'

interface ProjectedDurationSettings {
  estimateUncertainty: number
}

interface ProjectedDurationProps {
  record: Aha.Feature
  settings: ProjectedDurationSettings
}

export const ProjectedDuration = ({ record, settings }: ProjectedDurationProps) => {
  const [loading, setLoading] = useState(true)
  const [analysis, setAnalysis] = useState(null)

  useEffect(() => {
    (async () => {
      try {
        const data = await analyzeEstimateData(record, settings)
        console.log(data)
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

  if (!analysis || !analysis.estimate) {
    return <div className="ml-1 text-muted">No estimate provided</div>
  }

  return (
    <div className="ml-2">
      <div>
        {analysis.projectedDuration[0].toFixed(1)}d
        &mdash;
        {analysis.projectedDuration[1].toFixed(1)}d
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