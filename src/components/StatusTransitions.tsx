import React, { StyleHTMLAttributes } from 'react'
import { sumBy } from 'lodash'

interface StatusTransitionsProps {
  transitions: StatusTransition[]
}

const TimeInStatusMessage = ({ transition }: { transition: StatusTransition }) => (
  <>
    <strong><aha-icon icon="fa-regular fa-users" /> {transition.from.team}</strong><br />
    {transition.from.status}: {transition.duration.toFixed(1)}d
  </>
)

const TimeWithoutTeamMessage = ({ transition }: { transition: StatusTransition }) => (
  <>
    <strong>Not assigned to a team</strong><br />
    {transition.duration.toFixed(1)}d
  </>
)

const generateStyle = (t: StatusTransition, totalDuration: number) => {
  const style: React.CSSProperties = {
      width: `${100 * t.duration / totalDuration}%`,
      display: 'inline-block',
      height: 12
  }

  if (t.from.team) {
    style.backgroundColor = t.from.color
  } else {
    style.background = 'repeating-linear-gradient(-45deg, #eee, #eee 5px, #fff 5px, #fff 10px)'
  }

  return style
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
                <div key={i} style={generateStyle(t, totalDuration)}>
                  &nbsp;
                </div>
              </aha-tooltip-trigger>
              <aha-tooltip id={`transition-${i}`} placement="bottom">
                {
                  t.from.team ?
                    <TimeInStatusMessage transition={t} /> :
                    <TimeWithoutTeamMessage transition={t} />
                }
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