import format from 'date-fns/format'
import React, { useState } from 'react'
import useDeepCompareEffect from 'use-deep-compare-effect'
import { FeedbackTooltip } from './FeedbackTooltip'

interface ParameterProps {
  defaultValue: AnalysisSettingsUnion
  onChange: (parameters: AnalysisSettingsUnion) => void
}

export const Parameters = ({ defaultValue, onChange }: ParameterProps) => {
  const [parameters, setParameters] = useState<AnalysisSettingsUnion>(defaultValue)
  const updateParameter = (payload: Partial<AnalysisSettingsUnion>) => {
    // Check that all values are numeric before bubbling up
    for (let key in payload) {
      if (key === 'startDate') continue // skip startDate validation
      if (isNaN(payload[key])) return
    }

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
      <summary>
        <aha-flex justify-content='space-between'>
          <strong>Parameters</strong>
          <FeedbackTooltip />
        </aha-flex>
      </summary>
      <div className="mt-4">
        <aha-field layout="vertical">
          <div slot="label">Estimation uncertainty</div>
          <aha-flex align-items="center" gap="8px">
            <input type="range" min="1" max="99" step="1" defaultValue={parameters.estimateUncertainty} onChange={e => updateParameter({ estimateUncertainty: e.target.valueAsNumber })} />
            <span>{parameters.estimateUncertainty}%</span>
          </aha-flex>
          <div slot="help">How much inaccuracy do you expect during estimation?</div>
        </aha-field>
        {
          parameters.hasOwnProperty('totalAssignees') ?
            <aha-field layout="vertical">
              <div slot="label">Total assignees</div>
              <input type="number" min="1" defaultValue={(parameters as ReleaseAnalysisSettings).totalAssignees} onChange={e => updateParameter({ totalAssignees: e.target.valueAsNumber })} />
              <div slot="help">How many developers will work on this?</div>
            </aha-field>
            : ''
        }
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
        <aha-field layout="vertical">
          <div slot="label">Start date</div>
          <input type="date" defaultValue={format(Date.parse(parameters.startDate), 'yyyy-MM-dd')} onChange={e => updateParameter({ startDate: e.target.value })} />
          <div slot="help">When the work will begin</div>
        </aha-field>
      </div>
    </details>
  )
}