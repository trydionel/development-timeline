import React from "react";
import { ReleaseDuration } from "../components/ReleaseDuration";

aha.on("releaseDuration", ({ record, fields, onUnmounted }, { identifier, settings }) => {
  return (
    <>
      <ReleaseDuration record={record} settings={settings} />
    </>
  );
});