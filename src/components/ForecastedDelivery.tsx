import React from 'react'
import addBusinessDays from 'date-fns/addBusinessDays'

export const ForecastedDelivery = ({ analysis }: { analysis: RecordAnalysis | FeatureAnalysis | ReleaseAnalysis}) => (
  <div>
    <span>
      {addBusinessDays(Date.parse(analysis.settings.startDate), analysis.duration.remaining.projected[0]).toLocaleDateString()}
      <span className="mx-1">&mdash;</span>
      {addBusinessDays(Date.parse(analysis.settings.startDate), analysis.duration.remaining.projected[1]).toLocaleDateString()}
    </span>
    <span className="ml-1">
      <aha-tooltip-default-trigger aria-describedby="forecasted-delivery-tooltip"></aha-tooltip-default-trigger>
      <aha-tooltip id="forecasted-delivery-tooltip">
        <span>
          Total development time forecasted at {analysis.duration.remaining.projected[0].toFixed(1)}
          <span className="m-1">&mdash;</span>
          {analysis.duration.remaining.projected[1].toFixed(1)} working days.
          <br />
          Based on completing {analysis.duration.remaining.estimate.text} of work
          with a velocity of {analysis.duration.velocity.toFixed(2)}p / day
          and {analysis.settings.estimateUncertainty}% estimate uncertainty.
        </span>
      </aha-tooltip>
    </span>
  </div>
)