import React, { useEffect, useState } from 'react'
import { analyzeRelease } from '../data/analyzeEstimateData'
import { loadReleaseAnalysisData } from '../data/loaders/release'
import { Parameters } from './Parameters'
import useDeepCompareEffect from 'use-deep-compare-effect'
import { RiskBadge } from './RiskBadge'
import { ForecastedDelivery } from './ForecastedDelivery'

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
    startDate: new Date().toISOString(),
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
      updateAnalysis(parameters)
    } catch (e) {
      console.warn(`Unable to analyze estimate data for ${record.id}`, e)
    }
  }, [data, parameters])

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
            <h6>Forecasted delivery</h6>
            <ForecastedDelivery analysis={analysis} />
          </div>
        </div>

        {analysis.date.target ?
          <>
            <RiskBadge risk={analysis.date.risk} />
            &nbsp;
            {Math.abs(analysis.date.daysRemaining)} business days {analysis.date.daysRemaining < 0 ? 'since' : 'til'} target date
          </> :
          ''
        }
      </div>

      <Parameters defaultValue={parameters} onChange={updateAnalysis} />
    </>
  )
}