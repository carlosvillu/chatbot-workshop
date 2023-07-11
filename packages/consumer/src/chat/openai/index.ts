import debug from 'debug'
import {EventEmitter} from 'node:events'
import https from 'node:https'

import type {Question} from '../../embbeders/Models/Question.js'
import type {Results} from '../../vectorstores/Models/Results.js'

const {OPENAI_API_KEY = 'sk-'} = process.env
const log = debug('workshop:consumer:Chat:ChatOpenAI')

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}
interface Handlers {
  onToken: (token: string) => void
  onEnd: () => void
}

export class ChatOpenAI extends EventEmitter {
  static DONE = '[DONE]'
  /**
   * 4.- Vamos de los mismo config para la API de OpenAI nada nuevo.
   * */
  static MODEL = 'gpt-4' // esto si es nuevo :) ... aquí puede cambiar el modelo de OpenAI puede ser gpt-3.5-turbo o gpt-4 (GPT-4 de lejos da mejores resultados, pero es mucho más caro y lento)
  static OPTIONS = {
    hostname: 'api.openai.com',
    port: 443,
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}` // Recuerda el fichero .env
    }
  }

  /**
   * 5.- Y aquí tenemos al PROMPT !!! ( hay gente que gana un pastizal solo escribiendo estas cosas )
   *     Aquí solo están las Instrucciones para el bot.
   * */
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
    * Proporciona los enalces a las noticias que has usado para responder.
    * Nunca repitas los enlaces en tu respuesta. Si ya has proporcionado un enlace a una noticia no lo vuelvas a hacer.
    * No agregres algo parecedido a esto: "Según los fragmentos de noticias proporcionados" en tus respuestas.
  `

  static create(handlers: Handlers): ChatOpenAI {
    return new ChatOpenAI(handlers, [
      /**
       * 6.- Aquí tenemos el primer mensaje que va a ver chatGPT, donde le estamos indicand como queremos que actue, gracias a las indicaciones del PROMPT
       * */
      {role: 'system', content: ChatOpenAI.PROMPT}
    ])
  }

  constructor(
    private readonly handlers: Handlers,
    private readonly messages: Message[],
    private partial: string = ''
  ) {
    super()
    this.on('data', (data: string) => {
      this.partial += data
      handlers.onToken(data)
    })
    this.on('end', () => {
      /**
       *
       * 9 .- Por ultimo a la lista de mensajes le agregamos la respuesta del propio bot. Así cuando hagamos una siguiente pregunta, tb sabrá lo nos ha respondido anteriormente.
       *
       * */
      this.messages.push({role: 'assistant', content: '' + this.partial})
      this.partial = ''
      this.handlers.onEnd()
    })
  }

  async ask(question: Question, snippets: Results): Promise<void> {
    let res: () => void = () => {}

    /**
     * 7.- Aquí tenemos los mensajes que le vamos a enviar a chatGPT como usuario. Imaginate que estas escribiendo esto en la web de chatGPT.
     *     Si te fijas bien le estas pasando la pregunta y el contexto para esa pregunta.
     *
     *     Ha sido un largo camino solo para poder escribir esta cosita.
     * */
    const userPrompt = `
      Hola ElPaisGPT, me gustaría saber ${question.question}.
      Por favor basa tu respuesta en los siguientes fragmentos de noticias:
      ${snippets.toSnippet()}
    `.trim()
    this.messages.push({role: 'user', content: userPrompt})
    this.request(userPrompt)
    this.on('end', () => {
      res()
    })
    return await new Promise(resolve => {
      res = resolve
    })
  }

  request(content: string): void {
    const req = https.request(ChatOpenAI.OPTIONS, res =>
      res.on('data', data => {
        // https://github.com/openai/openai-node/issues/18#issuecomment-1369996933
        const lines = data
          .toString()
          .split('\n')
          .filter((line: string) => line.trim() !== '')
        for (const line of lines) {
          const message = line.replace(/^data: /, '')
          if (message === ChatOpenAI.DONE) return this.emit('end')

          try {
            const tokens = JSON.parse(message)?.choices?.[0]?.delta?.content
            tokens !== undefined && this.emit('data', tokens)
          } catch (error) {
            console.error('Could not JSON parse stream message', message, error) // eslint-disable-line no-console
          }
        }
      })
    )
    req.write(
      JSON.stringify({
        /**
         * 8.- Esta vez si es interesante que te fijes en la parte de la request. Fijate que le estamos pasando TODOS los mensajes anteriores y el que acabamos de contruir.
         *     Esto significa que chatGPT va a tener en cuenta todo lo que le hemos dicho hasta ahora para responder a nuestra pregunta.
         *     TENEMOS MEMÓRIA !!! 🧠🧠🧠
         *
         *     OJO con la memoria, si le pasas demasiado texto te puede devolver un error la API. La gestión de la memoria es un tema muy importante en los modelos de lenguaje. y Muy complejo.
         * */
        messages: [...this.messages, {role: 'user', content}],
        model: ChatOpenAI.MODEL,
        stream: true
      })
    )
    req.end()
  }

  toString(): string {
    return JSON.stringify(this.messages, null, 2)
  }
}
