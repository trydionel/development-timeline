import React from 'react'
import { EstimateAnalysis } from '../data/analyzeEstimateData'

export const RiskBadge = ({ risk }: { risk: EstimateAnalysis['risk'] }) => {
  switch (risk) {
    case 'ON_TRACK':
      return <aha-tag color="var(--aha-green-600)">On track</aha-tag> 
    case 'NEARING_ESTIMATE':
      return <aha-tag color="var(--aha-orange-600)">Nearing estimate</aha-tag> 
    case 'EXCEEDING_ESTIMATE':
      return <aha-tag color="var(--aha-red-700)">Exceeding estimate</aha-tag> 
    default:
      return null
  }

}