import { loadEstimationData } from "./loaders/common"
import { loadPerformanceData } from "./loaders/performance"

// FIXME: deprecate this
export async function loadRecordAnalysisData(record: Aha.RecordUnion): Promise<RecordDataRespose> {
  // Need this for the performance query
  const fields = ['teamId']

  // @ts-ignore-line
  await record.loadAttributes(...fields)

  const estimationData = await loadEstimationData(record)
  const performanceData = await loadPerformanceData(record.teamId)

  return {
    ...estimationData,
    ...performanceData
  }
}