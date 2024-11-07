/* eslint @typescript-eslint/no-misused-promises:0 */
import debug from 'debug'
import {randomUUID} from 'node:crypto'
import {createServer} from 'node:http'

import {ChatOllama} from './chat/ollama/index.js'
import {OllamaEmbedder} from './embbeders/ollama/index.js'
import {ChromaProvider} from './vectorstores/Providers/Chroma.js'

const log = debug('workshop:consumer:server')
const sessions = new Map()
const COOKIE_NAME = 'session_id'

const {PORT = 2024} = process.env

function getCookie(
  cookieHeader: string | undefined,
  name: string
): string | undefined {
  if (cookieHeader === undefined) return undefined
  const cookies = cookieHeader.split(';')
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=')
    if (cookieName === name) return cookieValue
  }
  return undefined
}

const server = createServer(async (req, res) => {
  // Añadir cabeceras CORS
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method !== 'POST') {
    res.writeHead(405)
    res.end('Method Not Allowed')
    return
  }

  let sessionId = getCookie(req.headers.cookie, COOKIE_NAME)
  const isNewSession = sessionId === undefined
  if (isNewSession) {
    sessionId = randomUUID()
    log(`Creating new session: ${sessionId}`)
  }

  let body = ''
  req.on('data', chunk => {
    body += chunk.toString() as string
  })

  req.on('end', async () => {
    try {
      const {question} = JSON.parse(body)
      if (question === undefined) {
        res.writeHead(400)
        res.end('Question is required')
        return
      }

      let chat = sessions.get(sessionId)
      if (chat === undefined) {
        chat = ChatOllama.create({
          onToken(token) {
            res.write(token)
          },
          onEnd() {
            res.end()
          }
        })
        sessions.set(sessionId, chat)
      }

      const embedder = OllamaEmbedder.create()
      const provider = await ChromaProvider.create('chatbot')

      const questionEmbedding = await embedder.embbed(question)
      const results = await provider.search(questionEmbedding)

      if (results === null) {
        res.writeHead(404)
        res.end('No results found')
        return
      }

      const headers: Record<string, string> = {
        'Content-Type': 'text/plain',
        'Transfer-Encoding': 'chunked'
      }

      if (isNewSession) {
        headers['Set-Cookie'] = `${COOKIE_NAME}=${
          sessionId as string
        }; HttpOnly; Path=/; Max-Age=3600`
      }

      res.writeHead(200, headers)
      await chat.ask(questionEmbedding, results)
    } catch (error) {
      log('Error:', error)
      res.writeHead(500)
      res.end('Internal Server Error')
    }
  })
})

server.listen(PORT, () => {
  log(`Server running at http://localhost:${PORT}/`)
})
