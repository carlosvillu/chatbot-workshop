export class Embedding {
  static validate(vector, doc) {
    if (!vector) throw new Error('[Embedding.validate] vector is required')
    if (!doc) throw new Error('[Embedding.validate] doc is required')
  }

  static create(vector, doc) {
    Embedding.validate(vector, doc)
    return new Embedding(vector, doc)
  }

  constructor(vector, doc) {
    this._vector = vector
    this._doc = doc
  }

  get vector() {
    return this._vector
  }

  get doc() {
    return this._doc
  }

  toJSON() {
    return {
      vector: this._vector,
      doc: this._doc
    }
  }
}
