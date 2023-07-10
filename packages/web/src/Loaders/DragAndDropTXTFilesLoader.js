import debug from 'https://esm.sh/debug'
import EventEmitter from 'https://esm.sh/eventemitter3'

import {Document} from '../Models/Document.js'

const log = debug('workshop:web:Loader:DragAndDropTXTFilesLoader')

export class DragAndDropTXTFilesLoader extends EventEmitter {
  static get ALLOW_TYPE() {
    return 'text/plain'
  }

  static validate(id) {
    if (typeof id !== 'string') throw new Error('[DragAndDropTXTFilesLoader.validate] id must be a string') // eslint-disable-line
  }

  static create(id) {
    DragAndDropTXTFilesLoader.validate(id)
    return new DragAndDropTXTFilesLoader(id)
  }

  constructor(id) {
    super()
    document.addEventListener('dragover', function (event) { event.preventDefault() }) // eslint-disable-line
    document.getElementById(id).addEventListener('drop', evt => {
      evt.preventDefault()
      this._loadFiles(evt.dataTransfer.files)
    })
  }

  async _loadFiles(files) {
    const allowFiles = Array.from(files).filter( file => file.type === DragAndDropTXTFilesLoader.ALLOW_TYPE ) // eslint-disable-line

    log(` 📂 Drop ${allowFiles.length} files`)

    const texts = await Promise.all(allowFiles.map(file => file.text()))
    const pages = texts.map(text => {
      const {body, URL} = this._parse(text)

      return Document.create(body, {url: URL})
    })

    const docs = pages.map(doc => this._split(doc)).flat(Infinity)
    this.emit('documents', docs)
  }

  _split(doc) {
    return doc.text
      .split('\n')
      .filter(text => text !== '')
      .map(text => Document.create(text, doc.meta))
  }

  _parse(text) {
    const URL = text.match(/## URL: (.*) ##/)?.[1] ?? ''
    const body = text.replace(/## URL: (.*) ##/, '')

    return {body, URL}
  }
}
