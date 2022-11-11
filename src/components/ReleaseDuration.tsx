import React, { useEffect, useState } from 'react'
import { analyzeRelease, ReleaseAnalysis, ReleaseAnalysisSettings } from '../data/analyzeEstimateData'
import { loadReleaseAnalysisData, ReleaseDataRespose } from '../data/loadEstimationData'
import { FeedbackTooltip } from './FeedbackTooltip'
import { Parameters } from './Parameters'
import useDeepCompareEffect from 'use-deep-compare-effect'
import { RiskBadge } from './RiskBadge'

interface ReleaseDurationProps {
  record: Aha.Release
  settings: Aha.Settings
}

function unwrapParameters(settings: Aha.Settings): ReleaseAnalysisSettings {
  return {
    estimateUncertainty: parseFloat(settings.estimateUncertainty as unknown as string),
    fancyMath: (settings.fancyMath as boolean),
    totalAssignees: parseFloat(settings.totalAssignees as unknown as string),
    defaultEstimate: parseFloat(settings.defaultEstimate as unknown as string),
    defaultVelocity: parseFloat(settings.defaultVelocity as unknown as string),
    estimateField: 'ORIGINAL',
    analyzeProgress: false
  }
}

export const ReleaseDuration = ({ record, settings }: ReleaseDurationProps) => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ReleaseDataRespose | null>(null)
  const [parameters, setParameters] = useState<ReleaseAnalysisSettings>(() => unwrapParameters(settings))
  const [analysis, setAnalysis] = useState<ReleaseAnalysis | null>(null)
  const updateAnalysis = (parameters) => {
    const analysis = analyzeRelease(data, parameters)
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
    setParameters(unwrapParameters(settings))
  }, [settings])

  useDeepCompareEffect(() => {
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
              {analysis.original.duration.projected[0].toFixed(1)}d
              <span className="m-1">&mdash;</span>
              {analysis.original.duration.projected[1].toFixed(1)}d
            </span>
            <span className="ml-1">
              <aha-tooltip-default-trigger aria-describedby="projected-duration-tooltip"></aha-tooltip-default-trigger>
              <aha-tooltip id="projected-duration-tooltip" placement="bottom">
                <span>
                  Based on distributing {analysis.original.duration.estimate.text} of work across {analysis.settings.totalAssignees} team members.
                </span>
              </aha-tooltip>
            </span>
          </div>
          <div className="text-right">
            <h6>Remaining duration</h6>
            <span>
              {analysis.remaining.duration.projected[0].toFixed(1)}d
              <span className="m-1">&mdash;</span>
              {analysis.remaining.duration.projected[1].toFixed(1)}d
            </span>
            <span className="ml-1">
              <aha-tooltip-default-trigger aria-describedby="remaining-duration-tooltip"></aha-tooltip-default-trigger>
              <aha-tooltip id="remaining-duration-tooltip" placement="bottom">
                <span>
                  Based on distributing {analysis.remaining.duration.estimate.text} of work across {analysis.settings.totalAssignees} team members.
                </span>
              </aha-tooltip>
            </span>
          </div>
        </div>

        <RiskBadge risk={analysis.date.risk} />
        &nbsp;
        { Math.abs(analysis.date.daysRemaining) } business days { analysis.date.daysRemaining < 0 ? 'since' : 'til' } target date

        <FeedbackTooltip />
      </div>

      <Parameters defaultValue={parameters} onChange={updateAnalysis} />
    </>
  )
}