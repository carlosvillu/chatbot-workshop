import debug from 'debug'
import https from 'node:https'

import type {Document} from '../../documents/Models/Document.js'
import {Embedding} from '../Models/Embbeding.js'

const {OPENAI_API_KEY = 'sk-'} = process.env
const chunk = <T>(arr: T[], size: number): T[][] =>
  arr.reduce(
    (acc: T[][], _, i) =>
      i % size !== 0 ? acc : [...acc, arr.slice(i, i + size)],
    []
  )
const log = debug('workshop:ingest:Embbeders:OpenAIEmbedder')

export class OpenAIEmbedder {
  /**
   * 3.- Generamos los embeddings de 10 en 10 (solo por fines demostrativos, en producción se puede hacer de 100 en 100)
   * */
  static CHUNKS_LEGTH = 10
  /**
   * 4.- Este es el modelo que vamos a usar para generar los embeddings. Es un modelo de OpenAI que genera embeddings de textos.
   *     https://platform.openai.com/docs/api-reference/embeddings
   *     Es decir a este modelo le pasamos un texto y nos devuelve un vector de 1536 dimensiones.
   *     Y los puntos próximos en el espacio vectorial son textos similares.
   *     Y NADIE SABE POR QUE FUNCIONA.
   * */
  static MODEL = 'text-embedding-ada-002'
  static OPTIONS = {
    hostname: 'api.openai.com',
    port: 443,
    path: '/v1/embeddings', // La URL esta sacada de la documentación de OpenAI -> https://platform.openai.com/docs/api-reference/embeddings
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      /**
       * 5.- Aquí es donde usamos la API KEY de OpenAI.
       *     Para obtener una API KEY tienes que registrarte en la plataforma de OpenAI.
       *     https://platform.openai.com/signup?launch
       *     Y una vez registrado puedes obtener tu API KEY en la sección de API KEYS
       *     https://platform.openai.com/account/api-keys
       *     Y la API KEY la tienes que guardar en un fichero .env en la raiz del proyecto.
       *     Para que te funciones vas a tener que dar de alta un tarjeta de crédito en la plataforma de OpenAI. Pero no te preocupes que no te van a cobrar mucho
       * */
      Authorization: `Bearer ${OPENAI_API_KEY}`
    }
  }

  static validate(docs: Document[]): void {
    if (!Array.isArray(docs)) {
      throw new Error(
        `[OpenAIEmbedder.validate] Invalid docs type ${typeof docs}`
      )
    }
  }

  static create(docs: Document[]): OpenAIEmbedder {
    OpenAIEmbedder.validate(docs)
    return new OpenAIEmbedder(docs)
  }

  constructor(private readonly docs: Document[]) {}

  async *embeddings(): AsyncGenerator<Embedding[]> {
    let counter = 0
    const chunksOfDocs = chunk(this.docs, OpenAIEmbedder.CHUNKS_LEGTH)
    for (const docs of chunksOfDocs) {
      /**
       * 6.- HAcemos la peticion a la API de OpenAI para generar los embeddings de los documentos. Recurda que solo podemos 10 documentos a la vez.
       * */
      const response = await this.request(docs)
      const json = JSON.parse(response)
      const vectors = json?.data?.map(
        (emb: {embedding: number[]}, index: number) => {
          /**
           * 7.- Creamos un array de modelos Embedding en los que almacemos el vector de 1536 dimensiones y el documento al que pertenece.
           * */
          return Embedding.create(emb.embedding, docs[index])
        }
      )
      counter = counter + docs.length
      log(`🔃 ${counter}/${this.docs.length} Documents vectors`)

      /**
       * 8.- Un Array de 10 embeddings
       * */
      yield vectors
    }
  }

  /**
   * Magia negra de la API no es importante.
   * No te lies con estos detalles de implementación.
   * */
  async request(docs: Document[]): Promise<string> {
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
      req.write(
        JSON.stringify({
          input: docs.map((doc: Document) => doc.text),
          model: OpenAIEmbedder.MODEL
        })
      )
      req.end()
    })
  }
}
