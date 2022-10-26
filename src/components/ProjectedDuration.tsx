import React, { useEffect, useState } from 'react'
import { analyzeEstimateData, EstimateAnalysis, EstimateAnalysisSettings } from '../data/analyzeEstimateData'
import { EstimatationDataRespose, loadEstimationData } from '../data/loadEstimationData'
import { RiskBadge } from './RiskBadge'
import { StatusTransitions } from './StatusTransitions'

interface ProjectedDurationProps {
  record: Aha.RecordUnion
  settings: EstimateAnalysisSettings
}

export const ProjectedDuration = ({ record, settings }: ProjectedDurationProps) => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<EstimatationDataRespose | null>(null)
  const [analysis, setAnalysis] = useState<EstimateAnalysis | null>(null)
  const [totalAssignees, setTotalAssignees] = useState<number>(1)
  const [estimateUncertainty, setEstimateUncertainty] = useState<number>(settings.estimateUncertainty)
  const [defaultEstimate, setDefaultEstimate] = useState<number>(settings.defaultEstimate || 1)

  useEffect(() => {
    (async () => {
      try {
        const data = await loadEstimationData(record)
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
      const analysis = analyzeEstimateData(data, {
        fancyMath: settings.fancyMath,
        estimateUncertainty,
        totalAssignees,
        defaultEstimate
      })
      console.log(analysis)
      setAnalysis(analysis)
    } catch (e) {
      console.warn(`Unable to analyze estimate data for ${record.id}`, e)
    }
  }, [data, settings, totalAssignees, estimateUncertainty, defaultEstimate])

  if (loading) {
    return <aha-spinner />
  }

  if (!analysis) {
    return <div className="ml-2" style={{ color: "var(--theme-accent-icon)" }}>Insufficient data</div>
  }

  return (
    <>
      <div className="ml-2 mt-1">
        <StatusTransitions transitions={analysis.transitions} className="mb-4" />

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
              <aha-tooltip id="projected-duration-tooltip">
                <span>
                  Based on velocity of {analysis.duration.velocity.toFixed(2)}p / day
                  and {analysis.settings.estimateUncertainty}% estimate uncertainty.
                </span>
              </aha-tooltip>
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <h6>Time in progress</h6>
            <div>
              <small>
                <RiskBadge risk={analysis.risk} />
              </small>
              &nbsp;
              {analysis.timeInProgress.toFixed(1)}d
            </div>
          </div>
        </div>

        <div>
          <small className="text-muted">
            What is this?&nbsp;
            <aha-tooltip-default-trigger trigger="development-trigger-info" />
            <aha-tooltip placement="bottom" id="development-trigger-info">
              This extension is exploring concepts from <br />
              https://big.aha.io/features/A-14541. Please send feedback to Jeff.
            </aha-tooltip>
          </small>
        </div>
      </div>

      <details className="my-4" style={{ backgroundColor: 'var(--theme-container-background	)', padding: 8, borderRadius: 2 }}>
        <summary><strong>Parameters</strong></summary>
        <div className="mt-4">
          <aha-field layout="vertical">
            <div slot="label">Estimation uncertainty</div>
            <input type="range" min="1" max="99" step="1" defaultValue={estimateUncertainty} onChange={e => setEstimateUncertainty(e.target.valueAsNumber)} />
            <div slot="help">How much inaccuracy do you expect during estimation?</div>
          </aha-field>
          <br />
          <aha-field layout="vertical">
            <div slot="label">Total assignees</div>
            <input type="number" defaultValue={totalAssignees} onChange={e => setTotalAssignees(e.target.valueAsNumber)} />
            <div slot="help">How many developers will work on this?</div>
          </aha-field>
          <aha-field layout="vertical">
            <div slot="label">Default estimate</div>
            <input type="number" defaultValue={defaultEstimate} onChange={e => setDefaultEstimate(e.target.valueAsNumber)} />
            <div slot="help">Default estimate for unestimated records (points)</div>
          </aha-field>
        </div>
      </details>
    </>
  )
}