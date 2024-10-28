import debug from 'debug'

import type {Document} from '../../documents/Models/Document.js'
import {Embedding} from '../Models/Embbeding.js'

const chunk = <T>(arr: T[], size: number): T[][] =>
  arr.reduce((acc: T[][], _, i) => (i % size !== 0 ? acc : [...acc, arr.slice(i, i + size)]), [])
const log = debug('workshop:ingest:Embbeders:OllamaEmbedder')

export class OllamaEmbedder {
  static CHUNKS_LEGTH = 10
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
          const response = await fetch(`${OllamaEmbedder.HOST}/api/embeddings`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: OllamaEmbedder.MODEL,
              prompt: 'search_document: ' + doc.text
            })
          })

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const data = await response.json()
          return Embedding.create(data.embedding, doc)
        })
      )

      counter = counter + docs.length
      log(`🔃 ${counter}/${this.docs.length} Documents vectors`)

      yield embeddings
    }
  }
}
