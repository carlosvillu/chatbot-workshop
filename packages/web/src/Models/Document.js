import debug from 'https://esm.sh/debug'

const log = debug('workshop:web:Models:Document')

export class Document {
  static validate(text, meta) {
    if (!text) {
      throw new Error('[Document.validate] text is required')
    }

    if (!meta) {
      throw new Error('[Document.validate] meta is required')
    }
  }

  static create(text, meta) {
    Document.validate(text, meta)
    return new Document(text, meta)
  }

  constructor(text, meta) {
    this._text = text
    this._meta = meta
  }

  get text() {
    return this._text
  }

  get meta() {
    return this._meta
  }

  toJSON() {
    return {
      text: this._text,
      meta: this._meta
    }
  }
}
