export class Results {
  static validate(results) {
    if (!results) throw new Error('[Results.validate] results is required')
  }

  static create(results) {
    Results.validate(results)
    return new Results(results)
  }

  constructor(results) {
    this._results = results.sort((a, b) => b.distance - a.distance)
  }

  get results() {
    return this._results
  }

  top(k) {
    return this._results.slice(0, k)
  }

  toJSON() {
    return {
      results: this._results.map(result => result.toJSON())
    }
  }
}
