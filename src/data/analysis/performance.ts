import { EstimateAnalysisSettings, PerformanceAnalysis } from "../analyzeEstimateData"
import { PerformanceDataResponse } from "../loadEstimationData"

const HOURS_IN_WORKDAY = 8
const WORKDAYS_IN_WEEK = 5

export function analyzePerformance(data: PerformanceDataResponse, settings?: EstimateAnalysisSettings): PerformanceAnalysis {
  // Velocity: team and individual
  const weeks = data.throughput.timeSeries
  if (weeks.length === 0) {
    return { velocity: {}, duration: { ideal: 0, projected: [0, 0] } } // FIXME
  }

  const points = weeks.reduce((acc, s) => acc + s.originalEstimate, 0)
  const days = weeks.length * WORKDAYS_IN_WEEK
  const team = points / days
  // FIXME: Need to count committers per week, not total team size
  const individual = team / data.users.totalCount

  const velocity: PerformanceAnalysis['velocity'] = {
    team,
    individual,
    teamMember: {}
  }

  // Generate per-person velocities if the team is using individual capacity for sprint planning
  if (data.project.currentIteration && data.project.currentIteration.teamMembers) {
    data.project.currentIteration.teamMembers.forEach((t) => {
      velocity.teamMember[t.user.id] = t.storyPoints / (t.workingHours / HOURS_IN_WORKDAY)
    }, {})
  }

  return {
    teamId: data.project.id,
    totalMembers: data.users.totalCount,
    velocity
  }
}