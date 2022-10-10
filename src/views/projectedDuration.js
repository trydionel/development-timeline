import React from "react";
import { ProjectedDuration } from "../components/ProjectedDuration";

aha.on("projectedDuration", ({ record, fields, onUnmounted }, { identifier, settings }) => {
  return (
    <>
      <ProjectedDuration record={record} settings={settings} />
    </>
  );
});