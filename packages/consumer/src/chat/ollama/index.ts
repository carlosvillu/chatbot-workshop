import debug from 'debug'
import {EventEmitter} from 'node:events'
import ollama from 'ollama/browser'

import type {Question} from '../../embbeders/Models/Question.js'
import type {Results} from '../../vectorstores/Models/Results.js'

const log = debug('workshop:consumer:Chat:ChatOllama')

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface Handlers {
  onToken: (token: string) => void
  onEnd: () => void
}

export class ChatOllama extends EventEmitter {
  static MODEL = 'llama3.2:3b'

  static PROMPT = `
    Actua como ElPaisGPT, eres un bot conversacional que estas especializado en responder preguntas que el usuario te va a realizar proporcionandote fragmentos de noticias.
    Usa los fragmentos de las noticas que te van a proporcionar entre ### y ### como contexto para dar una respuesta coherente. Si el contexto no es suficiente para dar
    una respuesta es correcto que simplemente digas que no lo sabes y que necesitas más contexto para responder.
    Los enlaces a las noticias de donde han salido los fragmentos los vas a encontrar entre ||| y ||| justo debajo de cada fragmento.

    Ten en cuenta lo siguiente cuando vayas a responder:
    * Hazlo siempre en el idioma de la última pregunta que te hayan hecho.
    * Se amable en tus respuestas y no seas ofensivo.
    * No seas repetitivo, no repitas la misma respuesta para preguntas similares.
    * No seas demasiado largo en tus respuestas, intenta ser conciso.
    * No seas demasiado corto en tus respuestas, intenta ser completo.
    * No seas demasiado formal en tus respuestas, intenta ser natural.
    * ES FUNDAMENTAL que empieces la respuesta con una lista de los enlaces a las noticias
    * Nunca repitas los enlaces en tu respuesta. Si ya has proporcionado un enlace a una noticia no lo vuelvas a hacer.
    * No agregres algo parecedido a esto: "Según los fragmentos de noticias proporcionados" o "Resumen de noticias" en tus respuestas.
  `

  static create(handlers: Handlers): ChatOllama {
    return new ChatOllama(handlers, [
      {role: 'system', content: ChatOllama.PROMPT}
    ])
  }

  constructor(
    private readonly handlers: Handlers,
    public readonly messages: Message[],
    private partial: string = ''
  ) {
    super()
    this.on('data', (data: string) => {
      this.partial += data
      handlers.onToken(data)
    })
    this.on('end', () => {
      this.messages.push({role: 'assistant', content: this.partial})
      this.partial = ''
      this.handlers.onEnd()
    })
  }

  async ask(question: Question, snippets: Results): Promise<void> {
    // @ts-expect-error
    const {promise, resolve} = Promise.withResolvers()

    const userPrompt = `
      Hola ElPaisGPT, me gustaría saber ${question.question}.
      Por favor basa tu respuesta en los siguientes fragmentos de noticias:
      ${snippets.toSnippet()}
    `.trim()

    this.messages.push({role: 'user', content: userPrompt})

    try {
      const response = await ollama.chat({
        model: ChatOllama.MODEL,
        messages: [...this.messages],
        stream: true
      })

      this.on('end', () => {
        resolve()
      })

      for await (const part of response) {
        this.emit('data', part.message.content)
      }

      this.emit('end')
    } catch (error) {
      log('Error in chat:', error)
      throw error
    }

    return promise
  }

  toString(): string {
    return JSON.stringify(this.messages, null, 2)
  }
}
