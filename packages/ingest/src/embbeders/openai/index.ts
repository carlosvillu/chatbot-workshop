import debug from 'debug'
import https from 'node:https'

import type {Document} from '../../documents/Models/Document.js'
import {Embedding} from '../Models/Embbeding.js'

const {OPENAI_API_KEY = 'sk-'} = process.env
const chunk = <T>(arr: T[], size: number): T[][] =>
  arr.reduce((acc: T[][], _, i) => (i % size !== 0 ? acc : [...acc, arr.slice(i, i + size)]), [])
const log = debug('workshop:ingest:Embbeders:OpenAIEmbedder')

export class OpenAIEmbedder {
  static CHUNKS_LEGTH = 10
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

  static validate(docs: Document[]): void {
    if (!Array.isArray(docs)) {
      throw new Error(`[OpenAIEmbedder.validate] Invalid docs type ${typeof docs}`)
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
      const response = await this.request(docs)
      const json = JSON.parse(response)
      const vectors = json?.data?.map((emb: {embedding: number[]}, index: number) => {
        return Embedding.create(emb.embedding, docs[index])
      })
      counter = counter + docs.length
      log(`🔃 ${counter}/${this.docs.length} Documents vectors`)
      yield vectors
    }
  }

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
