export class Question {
  static validate(vector, question) {
    if (!vector) throw new Error('[Question.validate] vector is required')
    if (!question) throw new Error('[Question.validate] question is required')
  }

  static create(vector, question) {
    Question.validate(vector, question)
    return new Question(vector, question)
  }

  constructor(vector, question) {
    this._vector = vector
    this._question = question
  }

  get vector() {
    return this._vector
  }

  get question() {
    return this._question
  }

  toJSON() {
    return {
      vector: this._vector,
      question: this._question
    }
  }
}
