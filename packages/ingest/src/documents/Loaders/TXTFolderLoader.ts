import {promises as fs} from 'fs'

import debug from 'debug'
import fg from 'fast-glob'

import {Document} from '../Models/Document.js'

const log = debug('workshop:ingest:Loaders:TXTFolderLoader')

export class TXTFolderLoader {
  static validate(path: string): void {
    if (path === undefined) {
      throw new Error('[TXTFolderLoader.validate] Invalid path empty')
    }
  }

  static create(path: string): TXTFolderLoader {
    TXTFolderLoader.validate(path)
    return new TXTFolderLoader(path)
  }

  constructor(private readonly path: string) {}

  async loadAndSplit(): Promise<Document[]> {
    log(`📂 Loading TXT files from ${this.path}`)

    const files = await fg(`${this.path}/**/*.txt`)

    const pages = await Promise.all(
      files.map(async file => {
        const text = await fs.readFile(file, 'utf-8')

        const {body, URL} = this.parse(text)

        return Document.create(body, {path: file, URL})
      })
    )

    const docs = pages.map(doc => this.split(doc)).flat(Infinity) as Document[]
    log(`📂 Loaded ${docs.length} Documents from ${this.path}`)

    return docs
  }

  private split(doc: Document): Document[] {
    return doc.text
      .split('\n')
      .map(text => Document.create(text, doc.meta))
      .filter(doc => doc.text !== '')
  }

  private parse(text: string): {body: string; URL: string} {
    const URL = text.match(/## URL: (.*) ##/)?.[1] ?? ''
    const body = text.replace(/## URL: (.*) ##/, '')

    return {body, URL}
  }
}
