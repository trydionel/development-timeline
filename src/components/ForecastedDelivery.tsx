import React from 'react'
import addBusinessDays from 'date-fns/addBusinessDays'

export const ForecastedDelivery = ({ analysis }: { analysis: RecordAnalysis | FeatureAnalysis | ReleaseAnalysis}) => {
  const startDate = new Date(Date.parse(analysis.settings.startDate))
  const today = new Date()
  const anchorDate = startDate > today ? startDate : today

  return (
    <div>
      <span>
        {addBusinessDays(anchorDate, analysis.duration.remaining.projected[0]).toLocaleDateString()}
        <span className="mx-1">&mdash;</span>
        {addBusinessDays(anchorDate, analysis.duration.remaining.projected[1]).toLocaleDateString()}
      </span>
      <span className="ml-1">
        <aha-tooltip-default-trigger aria-describedby="forecasted-delivery-tooltip"></aha-tooltip-default-trigger>
        <aha-tooltip id="forecasted-delivery-tooltip">
          <span>
            Total development time forecasted at <strong>{analysis.duration.remaining.projected[0].toFixed(1)}
            <span className="m-1">&mdash;</span>
            {analysis.duration.remaining.projected[1].toFixed(1)} working days.</strong>
            <br />
            <br />
            Based on completing <strong>{analysis.duration.remaining.estimate.text}</strong> of work
            with {analysis.duration.basis.toLowerCase()} velocity
            <br />
            of <strong>{analysis.duration.velocity.toFixed(2)}p / person / day</strong> and <strong>{analysis.settings.estimateUncertainty}%</strong> estimate uncertainty.
          </span>
        </aha-tooltip>
      </span>
    </div>
  )
}