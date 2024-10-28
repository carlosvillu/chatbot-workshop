import debug from 'debug'

import {pipeline} from '@xenova/transformers'

import type {Document} from '../../documents/Models/Document.js'
import {Embedding} from '../Models/Embbeding.js'

const chunk = <T>(arr: T[], size: number): T[][] =>
  arr.reduce((acc: T[][], _, i) => (i % size !== 0 ? acc : [...acc, arr.slice(i, i + size)]), [])
const log = debug('workshop:ingest:Embbeders:HFEmbedder')

export class HFEmbedder {
  static CHUNKS_LEGTH = 10
  static MODEL = 'Xenova/e5-large-v2' // https://huggingface.co/spaces/mteb/leaderboard

  static validate(docs: Document[]): void {
    if (!Array.isArray(docs)) {
      throw new Error(`[HFEmbedder.validate] Invalid docs type ${typeof docs}`)
    }
  }

  static create(docs: Document[]): HFEmbedder {
    HFEmbedder.validate(docs)
    return new HFEmbedder(docs)
  }

  constructor(private readonly docs: Document[]) {}

  async *embeddings(): AsyncGenerator<Embedding[]> {
    let counter = 0
    const generateEmbeddings = await pipeline('feature-extraction', HFEmbedder.MODEL)

    const chunksOfDocs = chunk(this.docs, HFEmbedder.CHUNKS_LEGTH)
    for (const docs of chunksOfDocs) {
      yield Promise.all(
        docs.map(async (doc: Document) => {
          const {embedding} = await generateEmbeddings(doc.text)
          return Embedding.create(embedding, doc)
        })
      ).then((embeddings: Embedding[]) => {
        counter = counter + docs.length
        log(`🔃 ${counter}/${this.docs.length} Documents vectors`)
        return embeddings
      })
    }
  }
}
