const PerformanceAnalysisQuery = `
  query PerformanceData($teamId: ID!, $throughputFilters: RecordEventFilters!, $velocityFilters: RecordEventFilters!) {
    velocity: recordEvents(filters: $velocityFilters) {
      timeSeries(timeGroup: WEEK, aggregation: SUM) {
        eventTimeIndex
        eventType
        units
        originalEstimate
        remainingEstimate
        seriesRange {
          from
          to
        }
      }
    }
    throughput: recordEvents(filters: $throughputFilters) {
      timeSeries(timeGroup: WEEK, aggregation: COUNT) {
        eventTimeIndex
        eventType
        units
        originalEstimate
        remainingEstimate
        seriesRange {
          from
          to
        }
      }
    }
    project(id: $teamId) {
      id
      currentIteration {
        teamMembers {
          id
          workingHours
          user {
            id
            name
          }
          storyPoints
        }
        name
        startDate
        duration
      }
    }
    users(filters: {projectId: $teamId}) {
      totalCount
    }
  }
`
export async function loadPerformanceData(teamId: TeamID): Promise<PerformanceDataResponse | null> {
  if (!teamId) {
    return null
  }

  const now = new Date()
  const filters = {
    createdAt: {
      gt: new Date(new Date().setDate(now.getDate() - 90)).toISOString(),
      lt: now.toISOString()
    },
    eventType: ["RECORD_COMPLETED"],
    teamId: teamId,
  }
  return await aha.graphQuery<PerformanceDataResponse>(PerformanceAnalysisQuery,
    {
      variables: {
        teamId: teamId,
        velocityFilters: {
          ...filters,
          units: "POINTS"
        },
        throughputFilters: filters,
      },
    });
}