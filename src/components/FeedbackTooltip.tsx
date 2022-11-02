import React from 'react'

export const FeedbackTooltip = () => (
  <div>
    <small className="text-muted">
      What is this?&nbsp;
      <aha-tooltip-default-trigger trigger="development-trigger-info" />
      <aha-tooltip placement="bottom" id="development-trigger-info">
        This extension is exploring concepts from <br />
        https://big.aha.io/features/A-14541. Please send feedback to Jeff.
      </aha-tooltip>
    </small>
  </div>
)