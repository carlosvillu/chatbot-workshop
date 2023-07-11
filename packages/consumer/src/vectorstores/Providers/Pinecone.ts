import debug from 'debug'

import {PineconeClient} from '@pinecone-database/pinecone'
import type {
  ScoredVector,
  VectorOperationsApi
} from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch/index.js'

import type {Question} from '../../embbeders/Models/Question.js'
import {Results} from '../Models/Results.js'

/**
 * 4.- No olvides poner tus credenciales de Pinecone en el archivo .env o vas a tener un error
 * */
const {PINECONE_API_KEY = '', PINECONE_ENVIRONMENT = ''} = process.env
const log = debug('workshop:consumer:vectorstores:PineconeProvider')

export class PineconeProvider {
  static DOCS_BY_QUERY = 4
  static validate(index: string, namespace: string): void {
    if (typeof index !== 'string') {
      throw new Error(
        `[PineconeProvider.validate] Invalid index type ${typeof index}`
      )
    }
    if (typeof namespace !== 'string') {
      throw new Error(
        `[PineconeProvider.validate] Invalid namespace type ${typeof namespace}`
      )
    }
  }

  static async create(
    index: string,
    namespace: string
  ): Promise<PineconeProvider> {
    PineconeProvider.validate(index, namespace)
    const client = new PineconeClient()
    await client.init({
      apiKey: PINECONE_API_KEY,
      environment: PINECONE_ENVIRONMENT
    })

    return new PineconeProvider(client.Index(index), namespace)
  }

  constructor(
    private readonly index: VectorOperationsApi,
    private readonly namespace: string
  ) {}

  async search(question: Question): Promise<Results | null> {
    /**
     * 5.- Simplemente usamos el cliente NodeJS de Pinecone para hacer una query.
     *     https://docs.pinecone.io/docs/node-client#indexquery
     * */
    const queryResponse = await this.index
      .query({
        queryRequest: {
          namespace: this.namespace,
          topK: PineconeProvider.DOCS_BY_QUERY, // Aquí le decimos que nos devuelva los 4 más proximos. Y hemos elegido 4 porque 3 es poco y 5 mucho.
          includeValues: true,
          includeMetadata: true,
          vector: question.vector // Aquí le pasamos el vector de la pregunta y usando la distancia del coseno con cada vector guardado nos va a devolver los 4 más proximos. Que además son los 4 semánticamente más proximos.
        }
      })
      .catch((error: Error) => log(`❌ ${error.message}`))

    if (queryResponse?.matches === undefined) {
      return null
    }

    /**
     * 6.- Estamos creando un modelo que encapsula los textos devueltos por la query. Desde este punto ya no necesitamos los vecotres, solo los textos. y la URL.
     *     Los vectores han complido su función. que era la de encontrar los documentos más proximos.
     * */
    const results = Results.create(
      // @ts-expect-error
      queryResponse.matches.map((match: ScoredVector) => match?.metadata?.text),
      // @ts-expect-error
      queryResponse.matches.map((match: ScoredVector) => match?.metadata?.url)
    )

    log(`✅ ${results.length()} results found`)
    return results
  }
}
