export class Record {
  static validate(id, values, metadata) {
    if (!id) throw new Error('[Record.validate] id is required')
    if (!values) throw new Error('[Record.validate] values is required')
    if (!metadata) throw new Error('[Record.validate] metadata is required')
  }

  static create(id, values, metadata) {
    Record.validate(id, values, metadata)
    return new Record(id, values, metadata)
  }

  constructor(id, values, metadata) {
    this._id = id
    this._values = values
    this._metadata = metadata
  }

  get id() {
    return this._id
  }

  get values() {
    return this._values
  }

  get metadata() {
    return this._metadata
  }

  toJSON() {
    return {
      id: this._id,
      values: this._values,
      metadata: this._metadata
    }
  }
}
