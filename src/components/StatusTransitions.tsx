import React from 'react'
import { sumBy } from 'lodash'
import { StatusTransition } from '../data/analysis/progress'

interface StatusTransitionsProps {
  transitions: StatusTransition[]
}

export const StatusTransitions = ({ transitions }: StatusTransitionsProps) => {
  const totalDuration = sumBy(transitions, t => t.duration || 0)

  return (
    <div className="timeline" style={{ margin: '8px 0' }}>
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
                {t.from.status}: {t.duration.toFixed(1)}d
              </aha-tooltip>
            </>
          )
        })}
      </div>
      <div className="timeline--labels" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
        <span>{ transitions[0].from.timestamp.toLocaleDateString() }</span>
        <span>{ transitions[transitions.length - 1].to.timestamp.toLocaleDateString() }</span>
      </div>
    </div>
  )
}