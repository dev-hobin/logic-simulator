import { createMachine, assign } from 'xstate'

type Context = {
  count: number
}

type Events = { type: 'INCREMENT' } | { type: 'DECREMENT' } | { type: 'RESET' }

export const machine = createMachine({
  types: {} as {
    context: Context
    events: Events
  },
  id: 'counter',
  initial: 'idle',
  context: { count: 0 },
  states: {
    idle: {
      on: {
        INCREMENT: {
          actions: assign({ count: ({ context }) => context.count + 1 }),
        },
        DECREMENT: {
          actions: assign({ count: ({ context }) => context.count - 1 }),
        },
        RESET: {
          actions: assign({ count: 0 }),
        },
      },
    },
  },
})
