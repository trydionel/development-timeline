import React from "react";
import { FeatureDuration } from "../components/FeatureDuration";
import { ProjectedDuration } from "../components/ProjectedDuration";

aha.on("projectedDuration", ({ record, fields, onUnmounted }, { identifier, settings }) => {
  if (record.typename === 'Feature') {
    return <FeatureDuration record={record} settings={settings} />
  }

  return <ProjectedDuration record={record} settings={settings} />
});