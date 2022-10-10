import { chain, sortBy, find } from 'lodash'

export function findTransitions(events) {
  const raw = sortBy(events, "createdAt");
  const typeFilter = [
    "RECORD_REMOVED_FROM_TEAM_WORKFLOW_STATUS",
    "RECORD_ADDED_TO_TEAM_WORKFLOW_STATUS"
  ];

  return chain(raw)
    .filter((e) => typeFilter.includes(e.eventType) && e.team.isTeam)
    .groupBy(
      (e) => `${e.workflow ? e.workflow.name : "unknown"}#${e.createdAt}`
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
      const [workflow, timestamp] = key.split("#");
      const timestamps = chain(obj)
        .values()
        .flatten()
        .map("createdAt")
        .uniq()
        .sort()
        .value();
      const first = timestamps[0];
      const last = timestamps[timestamps.length - 1];
      const nextTimestamp =
        chain(timestamps)
          .indexOf(timestamp)
          .thru((index) => timestamps[index + 1])
          .value() || new Date();

      const range = +new Date() - Date.parse(first);
      const duration = Date.parse(nextTimestamp) - Date.parse(timestamp);
      const ratio = duration / range;

      // Guaranteed to exist
      const from = find(events, {
        eventType: "RECORD_REMOVED_FROM_TEAM_WORKFLOW_STATUS"
      });
      const to = find(events, {
        eventType: "RECORD_ADDED_TO_TEAM_WORKFLOW_STATUS"
      });

      return {
        timestamp,
        duration,
        ratio,
        team: to && to.team.name,
        from: from.teamWorkflowStatus.name,
        statusCategory: from.teamWorkflowStatus.internalMeaning,
        to: to && to.teamWorkflowStatus.name,
        color: `#${(from.teamWorkflowStatus.color & 0xffffff).toString(16)}`
      };
    })
    .value();
}