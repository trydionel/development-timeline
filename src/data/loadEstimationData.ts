export interface EstimatationDataRespose {
  feature: Aha.Feature
  throughput: {
    timeSeries: any[] // No pre-defined type for this?
  }
  transitions: {
    raw: Aha.RecordEventRaw[]
  }
}

const EstimationDataQuery = `
 query EstimationData($id: ID!, $throughputFilters: RecordEventFilters!, $transitionFilters: RecordEventFilters!) {
   feature(id: $id) {
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
 }
`

export async function loadEstimationData(record) {
  const now = new Date()

  // Need this for the throughput query
  await record.loadAttributes('teamId')

  return await aha.graphQuery<EstimatationDataRespose>(EstimationDataQuery,
    {
      variables: {
        id: record.id,
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
          featureId: record.id,
          eventType: [
            "RECORD_ADDED_TO_TEAM_WORKFLOW_STATUS",
            "RECORD_REMOVED_FROM_TEAM_WORKFLOW_STATUS",
          ],
        },
      },
    });
}