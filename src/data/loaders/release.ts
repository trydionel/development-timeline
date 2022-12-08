import { CommonRecordFragment } from "./common"
import { loadPerformanceData } from "./performance"

const ReleaseFeaturesQuery = `
  query ReleaseData($id: ID!) {
    features(filters: { releaseId: $id }, order: [{name: position, direction: ASC}]) {
      nodes {
        ${CommonRecordFragment}
        startDate
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

async function loadFeaturesForRelease(release): Promise<RelatedFeaturesResponse> {
  return await aha.graphQuery<RelatedFeaturesResponse>(ReleaseFeaturesQuery,
    {
      variables: {
        id: release.id
      },
    });
}

export async function loadReleaseAnalysisData(release: Aha.Release): Promise<ReleaseDataRespose> {
  // Get features for the release
  // Get team performance for associated teams

  const releaseData = await loadFeaturesForRelease(release)

  const performance = {}
  for (let f of releaseData.features.nodes) {
    if (f.teamId && !performance[f.teamId]) {
      performance[f.teamId] = await loadPerformanceData(f.teamId)
    }
  }

  return {
    features: releaseData.features.nodes,
    releaseDate: releaseData.releases.nodes[0].releaseDate,
    performance
  }
}
