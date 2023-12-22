import { createMachine, assign } from 'xstate'

export const machine = createMachine({
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
