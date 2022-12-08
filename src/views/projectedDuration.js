import React from "react";
import { FeatureDuration } from "../components/FeatureDuration";
import { ProjectedDuration } from "../components/ProjectedDuration";
import { ReleaseDuration } from "../components/ReleaseDuration";

aha.on("projectedDuration", ({ record, fields, onUnmounted }, { identifier, settings }) => {
  switch (record.typename) {
    case 'Feature': 
      return <FeatureDuration record={record} settings={settings} />
    case 'Release':
      return <ReleaseDuration record={record} settings={settings} />
    default:
      return <ProjectedDuration record={record} settings={settings} />
  }
});