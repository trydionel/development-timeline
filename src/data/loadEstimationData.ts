const RecordFragment = `
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
  startDate
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

const ReleaseFeaturesQuery = `
  query ReleaseData($id: ID!) {
    features(filters: { releaseId: $id }, order: [{name: position, direction: ASC}]) {
      nodes {
        ${RecordFragment}
      }
      totalCount
    }
    releases(filters: { id: [$id] }) {
      nodes {
        releaseDate
      }
    }
  }
`

const FeatureRequirementsQuery = `
  query FeatureRequirements($id: ID!) {
    feature(id: $id) {
      requirements {
        ${RecordFragment}
      }
    }
  }
`

export async function loadRecordAnalysisData(record: Aha.RecordUnion): Promise<RecordDataRespose> {
  // Need this for the performance query
  const fields = ['teamId']
  // if (record.typename === 'Epic') {
  //   fields.push('featuresCount')
  // } else if (record.typename === 'Feature') {
  //   fields.push('requirementsCount')
  // }

  // @ts-ignore-line
  await record.loadAttributes(...fields)

  // Does this record have children?
  //   Yes: Perform analysis of all children separately
  //   No: Perform analysis of single record
  // let children = null
  // if (record.typename === 'Epic') {

  // } else if (record.typename === 'Feature') {
  //   children = (await loadRequirementsForFeature(record)).feature.requirements
  // }

  const estimationData = await loadEstimationData(record)
  const performanceData = await loadPerformanceData(record)

  return {
    // children,
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
    features: releaseData.features.nodes,
    releaseDate: releaseData.releases.nodes[0].releaseDate,
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
  const filters = {
    createdAt: {
      gt: new Date(new Date().setDate(now.getDate() - 90)).toISOString(),
      lt: now.toISOString()
    },
    eventType: ["RECORD_COMPLETED"],
    teamId: record.teamId,
  }
  return await aha.graphQuery<PerformanceDataResponse>(PerformanceAnalysisQuery,
    {
      variables: {
        teamId: record.teamId,
        velocityFilters: {
          ...filters,
          units: "POINTS"
        },
        throughputFilters: filters,
      },
    });
}

export async function loadFeaturesForRelease(release): Promise<RelatedFeaturesResponse> {
  return await aha.graphQuery<RelatedFeaturesResponse>(ReleaseFeaturesQuery,
    {
      variables: {
        id: release.id
      },
    });
}

export async function loadRequirementsForFeature(feature: Aha.Feature): Promise<FeatureRequirementsResponse> {
  return await aha.graphQuery<FeatureRequirementsResponse>(FeatureRequirementsQuery,
    {
      variables: {
        id: feature.id
      },
    });
}