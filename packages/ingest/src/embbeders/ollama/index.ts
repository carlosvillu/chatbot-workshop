import debug from 'debug'

import type {Document} from '../../documents/Models/Document.js'
import {Embedding} from '../Models/Embbeding.js'

const chunk = <T>(arr: T[], size: number): T[][] =>
  arr.reduce((acc: T[][], _, i) => (i % size !== 0 ? acc : [...acc, arr.slice(i, i + size)]), [])
const log = debug('workshop:ingest:Embbeders:OllamaEmbedder')

export class OllamaEmbedder {
  /**
   * 3.- Generamos los embeddings de 10 en 10 (solo por fines demostrativos, en producción se puede hacer de 100 en 100)
   * */
  static CHUNKS_LEGTH = 10

  /**
   * 4.- Este es el modelo que vamos a usar para generar los embeddings. Es un modelo ollama https://ollama.com/library/nomic-embed-text
   *     Es un modelo que ha demostrado tener un rendimiento aceptable en texto de varios idiomas.
   *     Es decir a este modelo le pasamos un texto y nos devuelve un vector de 768 dimensiones.
   *     más info: https://huggingface.co/nomic-ai/nomic-embed-text-v1.5#adjusting-dimensionality
   *     Y los puntos próximos en el espacio vectorial son textos similares.
   *     Y NADIE SABE POR QUE FUNCIONA.
   *
   *     Cuando tenemos al proceso de Ollama corriedo, este expone un API en este puesto.
   * */
  static MODEL = 'nomic-embed-text'
  static HOST = 'http://localhost:11434'

  static validate(docs: Document[]): void {
    if (!Array.isArray(docs)) {
      throw new Error(`[OllamaEmbedder.validate] Invalid docs type ${typeof docs}`)
    }
  }

  static create(docs: Document[]): OllamaEmbedder {
    OllamaEmbedder.validate(docs)
    return new OllamaEmbedder(docs)
  }

  constructor(private readonly docs: Document[]) {}

  async *embeddings(): AsyncGenerator<Embedding[]> {
    let counter = 0
    const chunksOfDocs = chunk(this.docs, OllamaEmbedder.CHUNKS_LEGTH)

    for (const docs of chunksOfDocs) {
      const embeddings = await Promise.all(
        docs.map(async (doc: Document) => {
          /**
           * 6.- Hacemos la petición al end point de Ollama. y obtenemos los embeddings de 10 en 10
           * */
          const response = await fetch(`${OllamaEmbedder.HOST}/api/embeddings`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              /**
               * 5.- Le indicamos a ollama que modelo debe hacer el embedding del texto
               *     Este modelo necesita que usemos un prefix especial, para indicar la funcionalidad que le vamos a dar al embedding para
               *     optimizarlo. En este caso al ser una aplicación RAG el prefijo tiene que ser "search_document"
               *     más info: https://huggingface.co/nomic-ai/nomic-embed-text-v1.5#task-instruction-prefixes
               * */
              model: OllamaEmbedder.MODEL,
              prompt: 'search_document: ' + doc.text
            })
          })

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const data = await response.json()
          /**
           * 7.- Creamos un array de modelos Embedding en los que almacemos el vector de 1536 dimensiones y el documento al que pertenece.
           * */
          return Embedding.create(data.embedding, doc)
        })
      )

      counter = counter + docs.length
      log(`🔃 ${counter}/${this.docs.length} Documents vectors`)

      /**
       * 8.- Un array de 10 embeddings
       * */
      yield embeddings
    }
  }
}
