// https://www.npmjs.com/package/compute-cosine-similarity
/**
 *
 * 16 .- No es nada especial, solo calculo la distancia cosenoidal entre el vector del resultado y el vector de la pregunta.
 * */
import similarity from 'https://esm.sh/compute-cosine-similarity'

export class Result {
  static validate(question, record) {
    if (!question) throw new Error('[Result.validate] question is required')
    if (!record) throw new Error('[Result.validate] record is required')
  }

  static create(question, record) {
    Result.validate(question, record)
    return new Result(question, record)
  }

  constructor(question, record) {
    this._question = question
    this._record = record
    /**
     * 17 .- Y luego guardo la distancia en una propiedad privada.
     * */
    this._distance = this._calculateDistance(
      this._question.vector,
      this._record.values
    )
  }

  get question() {
    return this._question
  }

  get record() {
    return this._record
  }

  get distance() {
    return this._distance
  }

  _calculateDistance(questionVector, recordQuestion) {
    return similarity(questionVector, recordQuestion)
  }

  toJSON() {
    return {
      question: this._question.toJSON(),
      record: this._record.toJSON(),
      distance: this._distance
    }
  }
}
