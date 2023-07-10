interface Meta {
  [key: string]: string | number
}

export class Document {
  static validate(text: string, meta: Meta): void {
    if (text === undefined) {
      throw new Error('[Document.validate] Invalid Document text empty')
    }
    if (meta === undefined) {
      throw new Error('[Document.validate] Invalid Document meta empty')
    }
  }

  static create(text: string, meta: Meta = {}): Document {
    Document.validate(text, meta)
    return new Document(text, meta)
  }

  constructor(public readonly text: string, public readonly meta: Meta) {}
}
