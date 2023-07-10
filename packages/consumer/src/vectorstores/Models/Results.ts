export class Results {
  static validate(texts: string[]): void {
    if (!Array.isArray(texts)) {
      throw new Error(`[Results.validate] Invalid texts type ${typeof texts}`)
    }
    if (texts.length === 0) {
      throw new Error('[Results.validate] texts array is empty')
    }
    if (texts.some(text => typeof text !== 'string')) {
      throw new Error(
        '[Results.validate] texts array contains non-string values'
      )
    }
  }

  static create(texts: string[], urls: string[]): Results {
    Results.validate(texts)
    return new Results(texts, urls)
  }

  constructor(
    public readonly texts: string[],
    public readonly urls: string[]
  ) {}

  toSnippet(): string {
    return this.texts
      .map((text: string, index: number) => {
        return `
        ### ${text} ###
        |||${this.urls[index]}|||
      `
      })
      .join('\n')
  }

  length(): number {
    return this.texts.length
  }
}
