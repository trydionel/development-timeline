interface EstimatationDataRespose {
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
  return await aha.graphQuery<EstimatationDataRespose>(EstimationDataQuery,
    {
      variables: {
        id: record.id,
        throughputFilters: {
          createdAt: {
            gt: "2022-02-01T05:00:00.000Z",
            lt: "2022-10-16T04:00:00.000Z",
          },
          eventType: ["RECORD_COMPLETED"],
          teamId: aha.project.id,
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
