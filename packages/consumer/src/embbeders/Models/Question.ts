export class Question {
  static validate(question: string, vector: number[]): void {
    if (question === undefined)
      throw new Error(
        `[Question.validate] Invalid question type ${typeof question}`
      )
    if (!Array.isArray(vector))
      throw new Error(
        `[Question.validate] Invalid vector type ${typeof vector}`
      )
  }

  static create(question: string, vector: number[]): Question {
    return new Question(question, vector)
  }

  constructor(
    public readonly question: string,
    public readonly vector: number[]
  ) {}
}
