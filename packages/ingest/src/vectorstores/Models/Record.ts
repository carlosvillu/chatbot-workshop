interface Metadata {
  text: string
  url: string
}

export class Record {
  static validate(id: string, values: number[], metadata: Metadata): void {
    if (id === undefined)
      throw new Error(`[Record.validate] Invalid id type ${typeof id}`)
    if (!Array.isArray(values))
      throw new Error(`[Record.validate] Invalid values type ${typeof values}`)
    if (metadata === undefined)
      throw new Error(
        `[Record.validate] Invalid metadata type ${typeof metadata}`
      )
  }

  static create(id: string, values: number[], metadata: Metadata): Record {
    Record.validate(id, values, metadata)
    return new Record(id, values, metadata)
  }

  constructor(
    public readonly id: string,
    public readonly values: number[],
    public readonly metadata: Metadata
  ) {}

  toJSON(): {id: string; values: number[]; metadata: Metadata} {
    return {id: this.id, values: this.values, metadata: this.metadata}
  }
}
