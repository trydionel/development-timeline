import React from 'react'
import { RecordAnalysis } from '../data/analyzeEstimateData'

export const RiskBadge = ({ risk }: { risk: RecordAnalysis['risk'] }) => {
  switch (risk) {
    case 'ON_TRACK':
      return <span>
        <aha-icon icon="fa-solid fa-calendar-check" style={{ color: "var(--aha-green-600)" }} />
        <aha-tooltip>
          On track
        </aha-tooltip>
      </span>
    case 'NEARING_ESTIMATE':
      return <span>
        <aha-icon icon="fa-solid fa-hourglass-half" style={{ color: "var(--aha-orange-600)" }} />
        <aha-tooltip>
          Nearing estimate
        </aha-tooltip>
      </span>
    case 'EXCEEDING_ESTIMATE':
      return <span>
        <aha-icon icon="fa-solid fa-hourglass-clock" style={{ color: "var(--aha-red-700)" }} />
        <aha-tooltip>
          Trending late
        </aha-tooltip>
      </span>
    default:
      return null
  }
}