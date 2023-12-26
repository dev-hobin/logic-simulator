import { setup, fromPromise, assign } from 'xstate'

type Context = {
  controller: AbortController
  data: { message: string } | null
  error: { status: string; error: string } | null
}

type Events = { type: 'FETCH' } | { type: 'CANCEL' } | { type: 'REFETCH' }

const fetchLogic = fromPromise<{ message: string }, { signal: AbortSignal }>(
  async ({ input }) => {
    const response = await fetch('/ping', {
      signal: input.signal,
    })
    if (response.ok) {
      return response.json()
    } else {
      return { status: response.status, error: response.statusText }
    }
  },
)

export const machine = setup({
  types: {} as {
    context: Context
    events: Events
  },
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
              error: ({ event }) =>
                event.error as { status: string; error: string },
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
