import { RecordAnalysisSettings, PerformanceAnalysis } from "../analyzeEstimateData"

const HOURS_IN_WORKDAY = 8
const WORKDAYS_IN_WEEK = 5

export function analyzePerformance(data: PerformanceDataResponse, settings: RecordAnalysisSettings): PerformanceAnalysis {
  if (!data.throughput || data.throughput.timeSeries.length === 0) {
    return {
      teamId: '',
      totalMembers: 0,
      velocity: {
        team: 0,
        individual: settings.defaultVelocity
      },
    }
  }

  // Velocity: team and individual
  const weeks = data.throughput.timeSeries
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