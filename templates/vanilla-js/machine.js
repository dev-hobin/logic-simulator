import { setup, fromPromise, assign } from 'xstate'

const fetchLogic = fromPromise(async ({ input }) => {
  const response = await fetch('/ping', {
    signal: input.signal,
  })
  if (response.ok) {
    return response.json()
  } else {
    return { status: response.status, error: response.statusText }
  }
})

export const machine = setup({
  actors: {
    fetchLogic,
  },
}).createMachine({
  id: 'fetchMachine',
  initial: 'idle',
  context: { controller: new AbortController(), data: null, error: null },
  states: {
    idle: {
      on: {
        FETCH: {
          target: 'loading',
        },
      },
    },
    loading: {
      entry: [assign({ error: null })],
      exit: [assign({ controller: new AbortController() })],
      invoke: {
        src: 'fetchLogic',
        input: ({ context }) => ({ signal: context.controller.signal }),
        onDone: {
          target: 'success',
          actions: assign({
            data: ({ event }) => event.output,
          }),
        },
        onError: {
          target: 'fail',
          actions: [
            assign({
              error: ({ event }) => event.error,
            }),
          ],
        },
      },
      on: {
        CANCEL: {
          target: 'idle',
        },
      },
    },
    success: {
      on: {
        REFETCH: {
          target: 'loading',
        },
      },
    },
    fail: {
      on: {
        REFETCH: {
          target: 'loading',
        },
      },
    },
  },
})
