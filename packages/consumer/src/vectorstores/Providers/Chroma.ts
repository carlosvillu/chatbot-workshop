import {ChromaClient} from 'chromadb'
import debug from 'debug'

import type {Question} from '../../embbeders/Models/Question.js'
import {Results} from '../Models/Results.js'

const log = debug('workshop:consumer:vectorstores:ChromaProvider')

export class ChromaProvider {
  static DOCS_BY_QUERY = 4

  static validate(collection: string): void {
    if (typeof collection !== 'string') {
      throw new Error(
        `[ChromaProvider.validate] Invalid collection type ${typeof collection}`
      )
    }
  }

  static async create(collection: string): Promise<ChromaProvider> {
    ChromaProvider.validate(collection)
    const client = new ChromaClient({
      path: 'http://localhost:8000'
    })

    const col = await client.getOrCreateCollection({
      name: collection
    })

    return new ChromaProvider(col)
  }

  constructor(private readonly collection: any) {}

  async search(question: Question): Promise<Results | null> {
    try {
      const queryResponse = await this.collection.query({
        queryEmbeddings: [question.vector],
        nResults: ChromaProvider.DOCS_BY_QUERY
      })

      if (queryResponse?.metadatas?.[0] === undefined) {
        return null
      }

      const texts = queryResponse.metadatas[0].map(
        (metadata: any) => metadata.text
      )
      const urls = queryResponse.metadatas[0].map(
        (metadata: any) => metadata.url
      )

      const results = Results.create(texts, urls)
      log(`✅ ${results.length()} results found`)

      return results
    } catch (error) {
      log(`❌ ${(error as Error).message}`)
      return null
    }
  }
}
