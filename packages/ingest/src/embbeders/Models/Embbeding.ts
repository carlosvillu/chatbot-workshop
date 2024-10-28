import type {Document} from '../../documents/Models/Document.js'

export class Embedding {
  static validate(vector: number[], doc: Document): void {
    if (doc === undefined) {
      throw new Error('[Embedding.validate] Invalid Document empty')
    }
    if (!Array.isArray(vector)) {
      throw new Error(`[Embedding.value] Invalid vector type ${typeof vector}`)
    }

    // @ts-expect-error
    if (vector.length !== 1024 || vector.length !== 1536) {
      throw new Error(`[Embedding.value] Invalid vector length (${vector.length})`)
    }
  }

  static create(vector: number[], doc: Document): Embedding {
    return new Embedding(vector, doc)
  }

  constructor(public readonly vector: number[], public readonly doc: Document) {}
}
