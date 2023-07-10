import {pipeline} from 'https://cdn.jsdelivr.net/npm/@xenova/transformers'
import debug from 'https://esm.sh/debug'

import {Embedding} from '../Models/Embedding.js'
import {Question} from '../Models/Question.js'

const log = debug('workshop:web:Embbeders:HFEmbedder')
const chunk = (arr, size) => arr.reduce( (acc, _, i) => (i % size !== 0 ? acc : [...acc, arr.slice(i, i + size)]), [] ) // eslint-disable-line

export class HFEmbedder {
  static get MODEL() { return 'Xenova/all-MiniLM-L6-v2'} // eslint-disable-line
  static get CHUNKS_LEGTH() { return 10 } // eslint-disable-line

  static validate(docs) {
    if (!docs) throw new Error('[HFEmbedder.validate] docs is required')
  }

  static create(docs) {
    return new HFEmbedder(docs)
  }

  constructor(docs) {
    this._docs = docs
  }

  async *embeddings() {
    let counter = 0
    const generateEmbeddings = await pipeline( 'feature-extraction', HFEmbedder.MODEL ) // eslint-disable-line

    const chunksOfDocs = chunk(this._docs, HFEmbedder.CHUNKS_LEGTH)
    for (const docs of chunksOfDocs) {
      yield Promise.all(
        docs.map(async doc => {
          const {data} = await generateEmbeddings(doc.text, {
            pooling: 'mean',
            normalize: true
          })

          return Embedding.create(Array.from(data), doc)
        })
      ).then(embeddings => {
        counter = counter + docs.length
        log(`🔃 ${counter}/${this._docs.length} Documents vectors`)
        return embeddings
      })
    }
  }

  async question(question) {
    const generateEmbeddings = await pipeline('feature-extraction', HFEmbedder.MODEL) // eslint-disable-line
    const {data} = await generateEmbeddings(question, {
      pooling: 'mean',
      normalize: true
    })

    log(`🔃 vector generated for question: ${question}`)
    return Question.create(Array.from(data), question)
  }
}
