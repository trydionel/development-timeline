import React, { useState } from 'react'
import { EstimateAnalysisSettings } from '../data/analyzeEstimateData'
import useDeepCompareEffect from 'use-deep-compare-effect'

export const Parameters = ({ defaultValue, onChange }) => {
  // Unwrap defaultValue to get rid of the proxy behavior from Aha.Settings object
  const [parameters, setParameters] = useState<EstimateAnalysisSettings>(() => ({
    estimateUncertainty: defaultValue.estimateUncertainty,
    totalAssignees: defaultValue.totalAssignees,
    fancyMath: defaultValue.fancyMath,
    defaultEstimate: defaultValue.defaultEstimate,
    defaultVelocity: defaultValue.defaultVelocity,
    analyzeProgress: defaultValue.analyzeProgress
  }))
  const updateParameter = (payload: Partial<EstimateAnalysisSettings>) => {
    setParameters({
      ...parameters,
      ...payload
    })
  }

  useDeepCompareEffect(() => {
    onChange(parameters)
  }, [parameters])

  return (
    <details className="my-4" style={{ backgroundColor: 'var(--theme-container-background	)', padding: 8, borderRadius: 2 }}>
      <summary><strong>Parameters</strong></summary>
      <div className="mt-4">
        <aha-field layout="vertical">
          <div slot="label">Estimation uncertainty</div>
          <input type="range" min="1" max="99" step="1" defaultValue={parameters.estimateUncertainty} onChange={e => updateParameter({ estimateUncertainty: e.target.valueAsNumber })} />
          <div slot="help">How much inaccuracy do you expect during estimation?</div>
        </aha-field>
        <br />
        <aha-field layout="vertical">
          <div slot="label">Total assignees</div>
          <input type="number" min="1" defaultValue={parameters.totalAssignees} onChange={e => updateParameter({ totalAssignees: e.target.valueAsNumber })} />
          <div slot="help">How many developers will work on this?</div>
        </aha-field>
        <aha-field layout="vertical">
          <div slot="label">Default estimate</div>
          <input type="number" defaultValue={parameters.defaultEstimate} onChange={e => updateParameter({ defaultEstimate: e.target.valueAsNumber })} />
          <div slot="help">Default estimate for unestimated records (points)</div>
        </aha-field>
        <aha-field layout="vertical">
          <div slot="label">Default velocity</div>
          <input type="number" defaultValue={parameters.defaultVelocity} onChange={e => updateParameter({ defaultVelocity: e.target.valueAsNumber })} />
          <div slot="help">Default velocity for work not assigned to a team (points / person / day)</div>
        </aha-field>
      </div>
    </details>
  )
}