export const CommonRecordFragment = `
  assignedToUser {
    id
    name
  }
  initialEstimate {
    text
    value
    units
  }
  originalEstimate {
    text
    value
    units
  }
  remainingEstimate {
    text
    value
    units
  }
  teamId
  teamWorkflowStatus {
    internalMeaning
  }
  workflowStatus {
    internalMeaning
  }
`

const RecordAnalysisQuery = (typeField) => `
  query EstimationData($id: ID!, $transitionFilters: RecordEventFilters!) {
    record: ${typeField}(id: $id) {
      ${CommonRecordFragment}
      ${typeField !== 'requirement' ? 'startDate' : '' }
      ${typeField !== 'requirement' ? 'dueDate' : '' }
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
  }
`

export async function loadEstimationData(record: Aha.RecordUnion): Promise<EstimatationDataRespose> {
  const typeField = record.typename.toLowerCase()

  return await aha.graphQuery<EstimatationDataRespose>(RecordAnalysisQuery(typeField),
    {
      variables: {
        id: record.id,
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

