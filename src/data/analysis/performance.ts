const HOURS_IN_WORKDAY = 8
const WORKDAYS_IN_WEEK = 5

export function analyzePerformance(data: PerformanceDataResponse, settings: RecordAnalysisSettings): PerformanceAnalysis {
  // If there's no throughput, there will be no velocity by definition
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
  let points, days
  if (data.velocity && data.velocity.timeSeries.length > 0) {
    const weeks = data.velocity.timeSeries
    points = weeks.reduce((acc, s) => acc + (s.originalEstimate || 0), 0)
    days = weeks.length * WORKDAYS_IN_WEEK
  }

  if (points === 0) {
    // Convert throughput to velocity based on default estimate
    const weeks = data.throughput.timeSeries
    points = settings.defaultEstimate * weeks.reduce((acc, s) => acc + s.originalEstimate, 0)
    days = weeks.length * WORKDAYS_IN_WEEK
  }

  const team = points / days
  const individual = team / data.users.totalCount // FIXME: Need to count committers per week, not total team size

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