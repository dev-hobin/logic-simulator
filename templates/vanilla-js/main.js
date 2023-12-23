import { createActor, __unsafe_getAllOwnEventDescriptors } from 'xstate'
import { machine } from './machine'
import './style.css'

async function enableMocking() {
  if (process.env.NODE_ENV !== 'development') {
    return
  }
  const { worker } = await import('./mocks/browser')
  return worker.start({ onUnhandledRequest: 'bypass' })
}

const renderer = new (class {
  #root
  constructor(root) {
    this.#root = document.querySelector < HTMLDivElement > root
  }

  render(snapshot, send) {
    const nextEvents = __unsafe_getAllOwnEventDescriptors(snapshot)
    const eventButtons = nextEvents.reduce((html, ev) => {
      return `${html}<button id="${ev}" type="button">${ev}</button>`
    }, '')

    this.#root.innerHTML = `
      <div>
        <h1>${snapshot.machine.id}</h1>
        <h2>Current State: ${JSON.stringify(snapshot.value, null, 2)}</h2>
        <h2>Context</h2>
        <p>${JSON.stringify(snapshot.context, null, 2)}</p>
        <div>
          <h2>${
            nextEvents.length > 1 ? 'Next possible events' : 'Next event'
          }</h2>
          ${eventButtons}
        </div>
      </div>
    `

    nextEvents.forEach((ev) => {
      const button = this.#root.querySelector(`#${ev}`)
      if (button) {
        button.onclick = () => send({ type: ev })
      }
    })
  }
})('#app')

const actor = createActor(machine)
actor.subscribe((snapshot) => {
  renderer.render(snapshot, actor.send)
})
actor.start()

enableMocking().then(() => {
  renderer.render(actor.getSnapshot(), actor.send)
})
