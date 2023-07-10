import debug from 'debug'

import {PineconeClient} from '@pinecone-database/pinecone'
import type {
  ScoredVector,
  VectorOperationsApi
} from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch/index.js'

import type {Question} from '../../embbeders/Models/Question.js'
import {Results} from '../Models/Results.js'

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
    const queryResponse = await this.index
      .query({
        queryRequest: {
          namespace: this.namespace,
          topK: PineconeProvider.DOCS_BY_QUERY,
          includeValues: true,
          includeMetadata: true,
          vector: question.vector
        }
      })
      .catch((error: Error) => log(`❌ ${error.message}`))

    if (queryResponse?.matches === undefined) {
      return null
    }

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
