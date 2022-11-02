import React, { useEffect, useState } from 'react'
import { EstimateAnalysisSettings, analyzeRelease, ReleaseAnalysis } from '../data/analyzeEstimateData'
import { loadReleaseAnalysisData, ReleaseDataRespose } from '../data/loadEstimationData'
import { FeedbackTooltip } from './FeedbackTooltip'
import { Parameters } from './Parameters'

interface ReleaseDurationProps {
  record: Aha.Release
  settings: EstimateAnalysisSettings
}

export const ReleaseDuration = ({ record, settings }: ReleaseDurationProps) => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ReleaseDataRespose | null>(null)
  const [analysis, setAnalysis] = useState<ReleaseAnalysis | null>(null)
  const updateAnalysis = (settings) => {
    const analysis = analyzeRelease(data, {
      estimateUncertainty: settings.estimateUncertainty,
      totalAssignees: settings.totalAssignees,
      fancyMath: settings.fancyMath,
      defaultEstimate: settings.defaultEstimate,
      defaultVelocity: settings.defaultVelocity,
      analyzeProgress: false
    })
    console.log("analyzeRelease", analysis)
    setAnalysis(analysis)
  }

  useEffect(() => {
    (async () => {
      try {
        const data = await loadReleaseAnalysisData(record)
        setData(data)
      } catch (e) {
        console.warn(`Unable to load estimation data for ${record.id}`, e)
      } finally {
        setLoading(false)
      }
    })()
  }, [record])

  useEffect(() => {
    if (!data) return

    try {
      updateAnalysis(settings)
    } catch (e) {
      console.warn(`Unable to analyze estimate data for ${record.id}`, e)
    }
  }, [data, settings])

  if (loading) {
    return <aha-spinner />
  }

  if (!analysis) {
    return <div className="ml-2" style={{ color: "var(--theme-accent-icon)" }}>Insufficient data</div>
  }

  return (
    <>
      <div className="ml-2 mt-1">
        <div style={{ display: 'flex', justifyContent: 'space-between' }} className="mb-4">
          <div>
            <h6>Projected duration</h6>
            <span>
              {analysis.duration.projected[0].toFixed(1)}d
              <span className="m-1">&mdash;</span>
              {analysis.duration.projected[1].toFixed(1)}d
            </span>
            <span className="ml-1">
              <aha-tooltip-default-trigger aria-describedby="projected-duration-tooltip"></aha-tooltip-default-trigger>
              <aha-tooltip id="projected-duration-tooltip" placement="bottom">
                <span>
                  Based on distributing the work across {analysis.settings.totalAssignees} team members
                  and an {analysis.settings.estimateUncertainty}% estimate uncertainty.
                </span>
              </aha-tooltip>
            </span>
          </div>
        </div>

        <FeedbackTooltip />
      </div>

      <Parameters defaultValue={settings} onChange={updateAnalysis} />
    </>
  )
}