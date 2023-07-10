import debug from 'debug'
import {ulid} from 'ulid'

import {PineconeClient} from '@pinecone-database/pinecone'
import type {VectorOperationsApi} from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch/index.js'

import type {Embedding} from '../../embbeders/Models/Embbeding.js'
import {Record} from '../Models/Record.js'

const {PINECONE_API_KEY = '', PINECONE_ENVIRONMENT = ''} = process.env
const log = debug('workshop:ingest:vectorstores:PineconeProvider')

export class PineconeProvider {
  static validate(index: string): void {
    if (typeof index !== 'string') {
      throw new Error(
        `[PineconeProvider.validate] Invalid index type ${typeof index}`
      )
    }
  }

  static async create(
    index: string,
    namespace: string = ulid()
  ): Promise<PineconeProvider> {
    PineconeProvider.validate(index)
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

  async save(embeddings: Embedding[]): Promise<void> {
    const records = embeddings.map(embedding => {
      return Record.create(ulid(), embedding.vector, {
        text: embedding.doc.text,
        url: embedding.doc.meta.URL as string
      })
    })

    await this.index
      .upsert({
        upsertRequest: {
          vectors: records.map(record => record.toJSON()),
          namespace: this.namespace
        }
      })
      .then(() =>
        log(`💾 Saved ${records.length} vectors to ${this.namespace}`)
      )
      .catch((error: Error) => log(`❌ ${error.message}`))
  }
}
