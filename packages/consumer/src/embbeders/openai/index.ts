import debug from 'debug'
import https from 'node:https'

import {Question} from '../Models/Question.js'

const {OPENAI_API_KEY = 'sk-'} = process.env
const log = debug('workshop:consumer:Embbeders:OpenAIEmbedder')

export class OpenAIEmbedder {
  /**
   * 2.- Toda esta parte es igual a lo que ya hemos visto en la secciónd de ingest.
   *    Así que no me voy a parar mucho en explicarla.
   * */
  static MODEL = 'text-embedding-ada-002'
  static OPTIONS = {
    hostname: 'api.openai.com',
    port: 443,
    path: '/v1/embeddings',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`
    }
  }

  static create(): OpenAIEmbedder {
    return new OpenAIEmbedder()
  }

  async embbed(question: string): Promise<Question> {
    /**
     * 3.- Aquí es donde hacemos la petición a OpenAI para que nos genere el vector.
     *     Recuerda le pasamos una cadena de texto y nos devuelve un vector de 1536 dimensiones.
     * */
    const response = await this.request(question)
    const json = JSON.parse(response)
    const vector = json?.data?.[0]?.embedding
    log(`🔃 vector generated for question: ${question}`)

    /**
     * 4.- Generamos un modelo que encapsula la pregunta y el vector generado.
     * */
    return Question.create(question, vector)
  }

  /**
   * Nada interesante aquí solo hacemos una petición a la API de OpenAI.
   * */
  async request(question: string): Promise<string> {
    return await new Promise((resolve, reject) => {
      const req = https.request(OpenAIEmbedder.OPTIONS, res => {
        let body = ''
        req.on('error', error => {
          log(`[❌] => (${error.message})`)
          reject(error)
        })
        res.on('data', data => {
          body += data.toString() as string
        })
        res.on('end', () => {
          try {
            resolve(body)
          } catch (error) {
            // @ts-expect-error
            // eslint-disable-next-line
            log(`[❌] => (${error.message})`)
          }
        })
      })
      req.write(JSON.stringify({input: question, model: OpenAIEmbedder.MODEL}))
      req.end()
    })
  }
}
