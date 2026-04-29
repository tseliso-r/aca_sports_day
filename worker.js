import { createInitialState, normalizeGameState, reduceGameState } from './src/utils/gameState.js'

function createInitialSnapshot() {
  return {
    revision: 0,
    state: createInitialState(),
  }
}

function normalizeSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    return createInitialSnapshot()
  }

  if (snapshot.state) {
    return {
      revision: Number(snapshot.revision) || 0,
      state: normalizeGameState(snapshot.state),
    }
  }

  return {
    revision: Number(snapshot.revision) || 0,
    state: normalizeGameState(snapshot),
  }
}

async function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...(init.headers || {}),
    },
  })
}

export class SportsDayRoom {
  constructor(state, env) {
    this.state = state
    this.env = env
    this.snapshotPromise = null
    this.webSockets = new Set()
  }

  async loadSnapshot() {
    if (!this.snapshotPromise) {
      this.snapshotPromise = this.state.storage.get('snapshot').then(snapshot =>
        normalizeSnapshot(snapshot)
      )
    }

    return this.snapshotPromise
  }

  async saveSnapshot(snapshot) {
    const normalized = normalizeSnapshot(snapshot)
    await this.state.storage.put('snapshot', normalized)
    this.snapshotPromise = Promise.resolve(normalized)
    return normalized
  }

  broadcast(snapshot) {
    const payload = JSON.stringify({ type: 'snapshot', ...snapshot })

    for (const socket of [...this.webSockets]) {
      try {
        socket.send(payload)
      } catch {
        this.webSockets.delete(socket)
      }
    }
  }

  async applyAction(action) {
    const currentSnapshot = await this.loadSnapshot()
    const nextSnapshot = {
      revision: currentSnapshot.revision + 1,
      state: reduceGameState(currentSnapshot.state, action),
    }

    await this.saveSnapshot(nextSnapshot)
    this.broadcast(nextSnapshot)
    return nextSnapshot
  }

  async handleState(request) {
    if (request.method === 'GET') {
      return jsonResponse(await this.loadSnapshot())
    }

    if (request.method === 'POST') {
      const body = await request.json().catch(() => null)
      const action = body?.action

      if (!action || typeof action.type !== 'string') {
        return jsonResponse({ error: 'Invalid action' }, { status: 400 })
      }

      return jsonResponse(await this.applyAction(action))
    }

    return new Response('Method not allowed', { status: 405 })
  }

  async handleLive(request) {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected websocket', { status: 400 })
    }

    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)
    server.accept()
    this.webSockets.add(server)

    server.addEventListener('close', () => {
      this.webSockets.delete(server)
    })

    server.addEventListener('error', () => {
      this.webSockets.delete(server)
    })

    const snapshot = await this.loadSnapshot()
    server.send(JSON.stringify({ type: 'snapshot', ...snapshot }))

    return new Response(null, { status: 101, webSocket: client })
  }

  async fetch(request) {
    const url = new URL(request.url)

    if (url.pathname.endsWith('/api/live')) {
      return this.handleLive(request)
    }

    if (url.pathname.endsWith('/api/state')) {
      return this.handleState(request)
    }

    return new Response('Not found', { status: 404 })
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/api/')) {
      const id = env.SPORTS_ROOM.idFromName('main')
      return env.SPORTS_ROOM.get(id).fetch(request)
    }

    const assetResponse = await env.ASSETS.fetch(request)
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return assetResponse
    }

    if (assetResponse.status !== 404 || url.pathname === '/404.html') {
      return assetResponse
    }

    const fallbackUrl = new URL('/index.html', url)
    return env.ASSETS.fetch(new Request(fallbackUrl.toString()))
  },
}