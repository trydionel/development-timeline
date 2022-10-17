import { chain, groupBy, sortBy, find } from 'lodash'
import { differenceInBusinessDays } from 'date-fns'

interface StatusAssignment {
  timestamp: string
  team: string
  status: string
  category: string
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

function eventToStatusAssignment(raw: Aha.RecordEventRaw) {
  return {
    team: raw.team.name,
    status: raw.teamWorkflowStatus.name,
    category: raw.teamWorkflowStatus.internalMeaning,
    color: colorToHex(raw.teamWorkflowStatus.color)
  }
}

// Relevant transitions
// * [RECORD_ADDED_TO_TEAM, RECORD_ADDED_TO_TEAM_WORKFLOW_STATUS]
// * [RECORD_REMOVED_FROM_TEAM_WORKFLOW_STATUS, RECORD_ADDED_TO_TEAM_WORKFLOW_STATUS]
// * [RECORD_REMOVED_FROM_TEAM_WORKFLOW_STATUS, RECORD_REMOVED_FROM_TEAM]

export function findTransitions(events: Aha.RecordEventRaw[]): StatusTransition[] {
  const raw = sortBy(events, "createdAt");
  const transitions = chain(raw)
    .filter((e) => e.team.isTeam) // ignore workspace events
    .groupBy(
      (e) => `${e.team ? e.team.name : "unknown"}#${e.createdAt}`
    )
    .omitBy((events, key) => {
      const from = find(events, {
        eventType: "RECORD_REMOVED_FROM_TEAM_WORKFLOW_STATUS"
      });

      const to = find(events, {
        eventType: "RECORD_ADDED_TO_TEAM_WORKFLOW_STATUS"
      });

      // Skip if this is the initial assignment to the team
      if (!from) {
        return true;
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
    .map((events, key, obj) => {
      const [_, timestamp] = key.split("#");
      const timestamps = chain(obj)
        .values()
        .flatten()
        .map("createdAt")
        .uniq()
        .sort()
        .value();
      const fromTimestamp =
        chain(timestamps)
          .indexOf(timestamp)
          .thru((index) => timestamps[index - 1])
          .value()

      // FIXME: Still doesn't take full work schedule into account
      const duration = differenceInBusinessDays(Date.parse(timestamp), Date.parse(fromTimestamp))

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
          timestamp: fromTimestamp,
          ...eventToStatusAssignment(from)
        }
      };
    })
    .value();

    // FIXME: Missing timestamp for initial transition to team / not started status

    // Add transition event for current status to make analysis easier
    const last = transitions[transitions.length - 1]
    const duration = differenceInBusinessDays(Date.now(), Date.parse(last.to.timestamp))
    transitions.push({
      duration,
      from: last.to,
      to: null
    })

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