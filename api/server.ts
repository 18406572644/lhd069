import { createServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import jwt from 'jsonwebtoken'
import app from './app.js'

const JWT_SECRET = process.env.JWT_SECRET || 'craft-market-secret-2024'
const PORT = process.env.PORT || 3002

const server = createServer(app)

const wss = new WebSocketServer({ server, path: '/ws' })

const clients = new Map<number, WebSocket>()

wss.on('connection', (ws, req) => {
  const url = new URL(req.url || '', `http://localhost:${PORT}`)
  const token = url.searchParams.get('token')

  if (!token) {
    ws.close(4001, 'Missing token')
    return
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string; email: string }
    const userId = decoded.id

    clients.set(userId, ws)

    ws.on('close', () => {
      clients.delete(userId)
    })

    ws.on('error', () => {
      clients.delete(userId)
    })

    ws.send(JSON.stringify({ type: 'system', data: { message: 'Connected' } }))
  } catch {
    ws.close(4001, 'Invalid token')
  }
})

export function broadcast(userId: number, event: string, data: any) {
  const ws = clients.get(userId)
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: event, data }))
  }
}

export function broadcastAll(event: string, data: any) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: event, data }))
    }
  })
}

server.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`)
})

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received')
  wss.close()
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT signal received')
  wss.close()
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

export { wss }
export default app
