import React from 'react'
import { RiskLabel } from '../data/analyzeEstimateData'

export const RiskBadge = ({ risk }: { risk: RiskLabel }) => {
  switch (risk) {
    case 'EARLY':
      return <span>
        <aha-icon icon="fa-solid fa-calendar-check" style={{ color: "var(--aha-green-600)" }} />
        <aha-tooltip>
          Trending early
        </aha-tooltip>
      </span> 
    case 'ON_TRACK':
      return <span>
        <aha-icon icon="fa-solid fa-calendar-check" style={{ color: "var(--aha-green-600)" }} />
        <aha-tooltip>
          On track
        </aha-tooltip>
      </span>
    case 'NEARING':
      return <span>
        <aha-icon icon="fa-solid fa-hourglass-half" style={{ color: "var(--aha-orange-600)" }} />
        <aha-tooltip>
          Nearing estimate
        </aha-tooltip>
      </span>
    case 'EXCEEDING':
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