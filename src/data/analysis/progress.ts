import { chain, find } from 'lodash'
import { differenceInBusinessDays } from 'date-fns'

function colorToHex(color: number) {
  return `#${(color & 0xffffff).toString(16)}`
}

function eventToStatusAssignment(raw: Aha.RecordEventRaw, timestamp: string): StatusAssignment | {} {
  if (!raw) return {}

  return {
    id: raw.id,
    timestamp: new Date(Date.parse(timestamp)),
    team: raw.team.name,
    status: raw.teamWorkflowStatus.name,
    category: raw.teamWorkflowStatus.internalMeaning,
    color: colorToHex(raw.teamWorkflowStatus.color)
  }
}

export function findTransitions(events: Aha.RecordEventRaw[]): StatusTransition[] {
  const raw = chain(events)
    .filter((e) => e.team.isTeam)
    .sortBy("createdAt")
    .value();

  const eventPairs = chain(raw)
    .groupBy(
      (e) => `${e.team ? e.team.name : "unknown"}#${e.createdAt}`
    )
    .omitBy((events) => {
      const from = find(events, {
        eventType: "RECORD_REMOVED_FROM_TEAM_WORKFLOW_STATUS"
      });

      const to = find(events, {
        eventType: "RECORD_ADDED_TO_TEAM_WORKFLOW_STATUS"
      });

      // Forcibly include initial transition to team
      if (!from) {
        return false
      }

      // Skip if the two workflows in the transition don't match
      if (
        from.teamWorkflowStatus.workflow.name !==
        to.teamWorkflowStatus.workflow.name
      ) {
        return true;
      }

      return false;
    })
    .value()

  const timestamps = chain(eventPairs)
    .values()
    .flatten()
    .map("createdAt")
    .uniq()
    .sort()
    .value();

  const transitions = chain(eventPairs)
    .map((events, key) => {
      const [_, timestamp] = key.split("#");
      const timestampIndex = timestamps.indexOf(timestamp)
      const previousTimestamp = timestamps[timestampIndex - 1]

      // FIXME: Still doesn't take full work schedule into account
      // FIXME: Provides days only. Doesn't take business hours into account
      const duration = differenceInBusinessDays(Date.parse(timestamp), Date.parse(previousTimestamp))

      const from = find(events, {
        eventType: "RECORD_REMOVED_FROM_TEAM_WORKFLOW_STATUS"
      });
      const to = find(events, {
        eventType: "RECORD_ADDED_TO_TEAM_WORKFLOW_STATUS"
      });

      return {
        duration,
        to: eventToStatusAssignment(to, timestamp),
        from: eventToStatusAssignment(from, previousTimestamp)
        
      };
    })
    .value();


  // Remove initial transition to team since the second transition event has
  // picked it up at this point
  const first = transitions[0]
  if (first && !first.from.id) {
    transitions.shift()
  }

  // Add transition event for current status to make analysis easier
  const last = transitions[transitions.length - 1]
  if (last) {
    const now = Date.now()
    const duration = differenceInBusinessDays(now, Date.parse(last.to.timestamp))
    transitions.push({
      duration,
      from: last.to,
      to: { timestamp: new Date(now) }
    })
  }

  return transitions
}

export function analyzeProgress(data: EstimatationDataRespose, duration: DurationAnalysis, settings: RecordAnalysisSettings) {
  const transitions = findTransitions(data.transitions.raw)
  let timeInProgress = transitions
    .filter(t => t.from.category === "IN_PROGRESS")
    .reduce((acc, t) => acc + t.duration, 0)

  // Risk
  let risk: ProgressAnalysis['risk']
  if (timeInProgress === 0) {
    risk = 'NOT_STARTED'
  } else if (timeInProgress < duration.projected[0]) {
    risk = 'ON_TRACK'
  } else if (timeInProgress > duration.projected[0] && timeInProgress < duration.projected[1]) {
    risk = 'NEARING'
  } else if (timeInProgress > duration.projected[1]) {
    risk = 'EXCEEDING'
  }

  return {
    transitions,
    timeInProgress,
    risk,
  }
}