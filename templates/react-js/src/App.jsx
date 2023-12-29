import { __unsafe_getAllOwnEventDescriptors } from 'xstate'
import { useActor } from '@xstate/react'
import { createBrowserInspector } from '@statelyai/inspect'
import { machine } from './machine'

import './App.css'

function App() {
  const [state, send] = useActor(machine, {
    inspect: createBrowserInspector({
      url: 'https://stately.ai/registry/inspect',
    }).inspect,
  })

  const nextEvents = __unsafe_getAllOwnEventDescriptors(state).filter(
    (v) => !v.startsWith('xstate.'),
  )

  return (
    <div>
      <div>
        <h1>{state.machine.id}</h1>
        <h2>Current State: {JSON.stringify(state.value, null, 2)}</h2>
        <h2>Context</h2>
        <p>
          {JSON.stringify(
            { data: state.context.data, error: state.context.error },
            null,
            2,
          )}
        </p>
      </div>

      <div>
        <h2>{nextEvents.length > 1 ? 'Next possible events' : 'Next event'}</h2>
        <div>
          {nextEvents.map((event) => (
            <button key={event} onClick={() => send?.({ type: event })}>
              {event}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
