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

// Función auxiliar para parsear cookies
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
  if (req.method !== 'POST') {
    res.writeHead(405)
    res.end('Method Not Allowed')
    return
  }

  // Obtener o crear sessionId desde la cookie
  let sessionId = getCookie(req.headers.cookie, COOKIE_NAME)
  const isNewSession = sessionId === undefined
  if (isNewSession) {
    sessionId = randomUUID()
    log(`Creating new session: ${sessionId}`)
  }

  // Leer el body
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

      // Obtener o crear chat para la sesión
      let chat = sessions.get(sessionId)
      if (chat === undefined) {
        chat = ChatOllama.create({
          onToken(token) {
            // Escribir cada token directamente en la respuesta
            res.write(token)
          },
          onEnd() {
            res.end()
          }
        })
        sessions.set(sessionId, chat)
      }

      // Procesar la pregunta
      const embedder = OllamaEmbedder.create()
      const provider = await ChromaProvider.create('chatbot')

      const questionEmbedding = await embedder.embbed(question)
      const results = await provider.search(questionEmbedding)

      if (results === null) {
        res.writeHead(404)
        res.end('No results found')
        return
      }

      // Configurar headers para streaming y establecer la cookie
      const headers: Record<string, string> = {
        'Content-Type': 'text/plain',
        'Transfer-Encoding': 'chunked'
      }

      // Solo establecemos la cookie si es una nueva sesión
      if (isNewSession) {
        headers['Set-Cookie'] = `${COOKIE_NAME}=${sessionId as string}; HttpOnly; Path=/; Max-Age=3600` // eslint-disable-line 
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
