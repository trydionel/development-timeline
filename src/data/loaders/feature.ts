import { CommonRecordFragment, loadEstimationData } from "./common"
import { loadPerformanceData } from "./performance"

const FeatureRequirementsQuery = `
  query FeatureRequirements($id: ID!) {
    feature(id: $id) {
      requirements {
        ${CommonRecordFragment}
      }
    }
  }
`

async function loadRequirementsForFeature(feature: Aha.Feature): Promise<FeatureRequirementsResponse> {
  return await aha.graphQuery<FeatureRequirementsResponse>(FeatureRequirementsQuery,
    {
      variables: {
        id: feature.id
      },
    });
}

export async function loadFeatureAnalysisData(record: Aha.Feature): Promise<FeatureDataResponse> {
  await record.loadAttributes('teamId')

  const requirements = (await loadRequirementsForFeature(record)).feature.requirements
  const estimationData = await loadEstimationData(record)

  const performance: Record<TeamID, PerformanceDataResponse> = {}
  if (record.teamId) {
    performance[record.teamId] = await loadPerformanceData(record.teamId)
  }

  for (let req of requirements) {
    if (req.teamId && !performance[req.teamId]) {
      performance[req.teamId] = await loadPerformanceData(req.teamId)
    }
  }

  return {
    requirements,
    performance,
    record: (estimationData.record as Aha.Feature),
    transitions: estimationData.transitions
  }
}