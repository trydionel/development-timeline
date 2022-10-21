export interface EstimatationDataRespose {
  record: Aha.Feature
  project: Aha.Project
  throughput: {
    timeSeries: any[] // No pre-defined type for this?
  }
  transitions: {
    raw: Aha.RecordEventRaw[]
  }
}

const EstimationDataQuery = (typeField) => `
query EstimationData($id: ID!, $teamId: ID!, $throughputFilters: RecordEventFilters!, $transitionFilters: RecordEventFilters!) {
  record: ${typeField}(id: $id) {
    assignedToUser {
      id
      name
    }
    originalEstimate {
      text
      value
      units
    }
    teamWorkflowStatus {
     internalMeaning
    }
  }
  throughput: recordEvents(filters: $throughputFilters) {
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
  transitions: recordEvents(filters: $transitionFilters) {
    raw {
      teamWorkflowStatus {
        internalMeaning
        name
        color
        workflow {
          name
        }
      }
      createdAt
      eventType
      id
      team {
        name
        isTeam
      }
    }
  }
  project(id: $teamId) {
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
}
`

export async function loadEstimationData(record: Aha.RecordUnion) {
  const now = new Date()
  const typeField = record.typename.toLowerCase()

  // Need this for the throughput query
  await record.loadAttributes('teamId')

  return await aha.graphQuery<EstimatationDataRespose>(EstimationDataQuery(typeField),
    {
      variables: {
        id: record.id,
        teamId: record.teamId,
        throughputFilters: {
          createdAt: {
            gt: new Date(new Date().setDate(now.getDate() - 90)).toISOString(),
            lt: now.toISOString()
          },
          eventType: ["RECORD_COMPLETED"],
          teamId: record.teamId,
          units: "POINTS",
        },
        transitionFilters: {
          [`${typeField}Id`]: record.id,
          eventType: [
            "RECORD_ADDED_TO_TEAM_WORKFLOW_STATUS",
            "RECORD_REMOVED_FROM_TEAM_WORKFLOW_STATUS",
          ],
        },
      },
    });
}