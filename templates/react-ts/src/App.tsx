import { __unsafe_getAllOwnEventDescriptors } from 'xstate'
import { useActor } from '@xstate/react'
import { machine } from './machine'

import './App.css'

function App() {
  const [state, send] = useActor(machine)

  const nextEvents = __unsafe_getAllOwnEventDescriptors(state)

  return (
    <div>
      <div>
        <h1>{state.machine.id}</h1>
        <h2>Current State: {JSON.stringify(state.value, null, 2)}</h2>
        <h2>Context</h2>
        <p>{JSON.stringify(state.context, null, 2)}</p>
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
