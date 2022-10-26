import React from 'react'
import { sumBy } from 'lodash'
import { StatusTransition } from '../data/analysis/progress'

interface StatusTransitionsProps {
  transitions: StatusTransition[]
}

export const StatusTransitions = ({ transitions, ...props }: StatusTransitionsProps) => {
  if (transitions.length === 0) {
    return <></>
  }

  const totalDuration = sumBy(transitions, t => t.duration || 0)
  const startDate = transitions[0].from.timestamp
  const endDate = transitions[transitions.length - 1].to.timestamp

  return (
    <div className="timeline" {...props}>
      <div className="timeline--transitions" style={{ whiteSpace: 'nowrap', position: 'relative' }}>
        {transitions.map((t, i) => {
          return (
            <>
              <aha-tooltip-trigger trigger={`transition-${i}`} >
                <div key={i} style={{ backgroundColor: t.from.color, width: `${100 * t.duration / totalDuration}%`, display: 'inline-block', height: 12 }}>
                  &nbsp;
                </div>
              </aha-tooltip-trigger>
              <aha-tooltip id={`transition-${i}`} placement="bottom">
                <strong><aha-icon icon="fa-regular fa-users" /> {t.from.team}</strong><br />
                {t.from.status}: {t.duration.toFixed(1)}d
              </aha-tooltip>
            </>
          )
        })}
      </div>
      <div className="timeline--labels" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
        <span>{ startDate && startDate.toLocaleDateString() }</span>
        <span>{ endDate && endDate.toLocaleDateString() }</span>
      </div>
    </div>
  )
}