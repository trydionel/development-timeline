export interface EstimatationDataRespose {
  record: Aha.RecordUnion
  transitions: {
    raw: Aha.RecordEventRaw[]
  }
}

export interface PerformanceDataResponse {
  throughput: {
    timeSeries: any[] // No pre-defined type for this?
  }
  project: Aha.Project
  users: {
    totalCount: number
  }
}

export interface RelatedFeaturesResponse {
  features: {
    nodes: Aha.Feature[]
    totalCount: number
  }
}

export type RecordDataRespose = EstimatationDataRespose & PerformanceDataResponse

export interface ReleaseDataRespose extends RelatedFeaturesResponse {
  performance: Record<string, PerformanceDataResponse>
}

const RecordFragment = `
  assignedToUser {
    id
    name
  }
  originalEstimate {
    text
    value
    units
  }
  teamId
  teamWorkflowStatus {
    internalMeaning
  }
`

const RecordAnalysisQuery = (typeField) => `
  query EstimationData($id: ID!, $transitionFilters: RecordEventFilters!) {
    record: ${typeField}(id: $id) {
      ${RecordFragment}
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

const PerformanceAnalysisQuery = `
  query PerformanceData($teamId: ID!, $throughputFilters: RecordEventFilters!) {
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

const RelatedFeaturesQuery = `
  query ReleaseData($id: ID!) {
    features(filters: { releaseId: $id }, order: [{name: position, direction: ASC}]) {
      nodes {
        ${RecordFragment}
      }
      totalCount
    }
  }
`

export async function loadRecordAnalysisData(record: Aha.RecordUnion): Promise<RecordDataRespose> {
  // Need this for the performance query
  // @ts-ignore-line
  await record.loadAttributes('teamId')
  if (!record.teamId) {
    throw new Error('Record not assigned to a team')
  }

  const estimationData = await loadEstimationData(record)
  const performanceData = await loadPerformanceData(record)

  return {
    ...estimationData,
    ...performanceData
  }
}

export async function loadReleaseAnalysisData(release: Aha.Release): Promise<ReleaseDataRespose> {
  // Get features for the release
  // Get team performance for associated teams

  const releaseData = await loadFeaturesForRelease(release)

  const performance = {}
  for (let f of releaseData.features.nodes) {
    if (f.teamId && !performance[f.teamId]) {
      performance[f.teamId] = await loadPerformanceData(f)
    }
  }

  return {
    ...releaseData,
    performance
  }
}

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

export async function loadPerformanceData(record: Aha.RecordUnion): Promise<PerformanceDataResponse | null> {
  if (!record.teamId) {
    return null
  }

  const now = new Date()
  return await aha.graphQuery<PerformanceDataResponse>(PerformanceAnalysisQuery,
    {
      variables: {
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
      },
    });
}

export async function loadFeaturesForRelease(release): Promise<RelatedFeaturesResponse> {
  return await aha.graphQuery<RelatedFeaturesResponse>(RelatedFeaturesQuery,
    {
      variables: {
        id: release.id
      },
    });
}