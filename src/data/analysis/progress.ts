import { chain, find } from 'lodash'
import { differenceInBusinessDays } from 'date-fns'

interface StatusAssignment {
  id: string
  team: string
  status: string
  category: Aha.WorkflowStatusAttributes['internalMeaning']
  color: string
}

export interface StatusTransition {
  duration: number
  from?: StatusAssignment
  to?: StatusAssignment
}

function colorToHex(color: number) {
  return `#${(color & 0xffffff).toString(16)}`
}

function eventToStatusAssignment(raw: Aha.RecordEventRaw): StatusAssignment | {} {
  if (!raw) return {}

  return {
    id: raw.id,
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
        to: {
          timestamp,
          ...eventToStatusAssignment(to)
        },
        from: {
          timestamp: previousTimestamp,
          ...eventToStatusAssignment(from)
        }
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
    const duration = differenceInBusinessDays(Date.now(), Date.parse(last.to.timestamp))
    transitions.push({
      duration,
      from: last.to,
      to: null
    })
  }

  return transitions
}

export function analyzeProgress(events: Aha.RecordEventRaw[]) {
  const transitions = findTransitions(events)
  let timeInProgress = transitions
    .filter(t => t.from.category === "IN_PROGRESS")
    .reduce((acc, t) => acc + t.duration, 0)

  return {
    transitions,
    timeInProgress
  }
}