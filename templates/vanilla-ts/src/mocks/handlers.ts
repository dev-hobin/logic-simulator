import { http, delay, HttpResponse } from 'msw'

export const handlers = [
  http.get('/ping', async () => {
    await delay(2000)
    if (Math.random() <= 0.3) {
      return new HttpResponse(null, { status: 500 })
    }

    return HttpResponse.json({ message: 'pong' })
  }),
]
