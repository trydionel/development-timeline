import React, { useEffect, useState } from 'react'
import useDeepCompareEffect from 'use-deep-compare-effect'
import { analyzeFeature } from '../data/analyzeEstimateData'
import { loadFeatureAnalysisData } from '../data/loaders/feature'
import { FeedbackTooltip } from './FeedbackTooltip'
import { ForecastedDelivery } from './ForecastedDelivery'
import { Parameters } from './Parameters'
import { RiskBadge } from './RiskBadge'
import { StatusTransitions } from './StatusTransitions'

interface FeatureDurationProps {
  record: Aha.Feature
  settings: Aha.Settings
}

function unwrapParameters(settings: Aha.Settings): FeatureAnalysisSettings {
  return {
    estimateUncertainty: parseFloat(settings.estimateUncertainty as unknown as string),
    fancyMath: (settings.fancyMath as boolean),
    totalAssignees: parseFloat(settings.totalAssignees as unknown as string),
    defaultEstimate: parseFloat(settings.defaultEstimate as unknown as string),
    defaultVelocity: parseFloat(settings.defaultVelocity as unknown as string),
    startDate: new Date().toISOString(),
    analyzeProgress: true
  }
}

export const FeatureDuration = ({ record, settings }: FeatureDurationProps) => {
  const [loading, setLoading] = useState(true)
  const [parameters, setParameters] = useState<FeatureAnalysisSettings>(() => unwrapParameters(settings))
  const [data, setData] = useState<FeatureDataResponse | null>(null)
  const [analysis, setAnalysis] = useState<FeatureAnalysis | null>(null)
  const updateAnalysis = (parameters: FeatureAnalysisSettings) => {
    const analysis = analyzeFeature(data, parameters)
    setAnalysis(analysis)
  }

  useEffect(() => {
    (async () => {
      try {
        const data = await loadFeatureAnalysisData(record)

        if (data.record.startDate) {
          setParameters({
            ...parameters,
            startDate: data.record.startDate
          })
        }
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
        <StatusTransitions transitions={analysis.progress.transitions} className="mb-4" />

        <div style={{ display: 'flex', justifyContent: 'space-between' }} className="mb-4">
          <div>
            <h6>Forecasted delivery</h6>
            <ForecastedDelivery analysis={analysis} />
          </div>

          <div style={{ textAlign: 'right' }}>
            <h6>Time in progress</h6>
            <div>
              <RiskBadge risk={analysis.progress.risk} />
              &nbsp;
              {analysis.progress.timeInProgress.toFixed(1)}d
            </div>
          </div>
        </div>
      </div>

      <Parameters defaultValue={parameters} onChange={updateAnalysis} />

      <div className="ml-2 my-1">
        <FeedbackTooltip />
      </div>
    </>
  )
}