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

    /**
     * 2.- Cargamos todos los ficheros de la carpeta que nos pasan por parametro
     * */
    const files = await fg(`${this.path}/**/*.txt`)

    const pages = await Promise.all(
      files.map(async file => {
        /**
         * 3.- Leemos el contenido de cada fichero
         * */
        const text = await fs.readFile(file, 'utf-8')

        /**
         * 4.- Parseamos el contenido de cada fichero para obtener el body y la URL
         * */
        const {body, URL} = this.parse(text)

        /**
         * 5.- Creamos un documento con el body y la URL
         *    - El body es el contenido del fichero.
         *    es IMPORTANTE que los documentos sean lo más pequeños posibles y aun así mantener la semántica.
         *    - La URL es la URL de la noticia de la que proviene el documento. Y se adjunta como metadata del documento.
         *    - El path es la ruta del fichero.
         * */
        return Document.create(body, {path: file, URL})
      })
    )

    /**
     *  6.- Dividimos cada documento en párrafos
     *    Hemos decido que cada párrafo es la minima unidad semántica de un documento.
     *    - Cada párrafo es un documento
     *    Por lo que pasamos de tener un documentos por noticia a N documentos por noticia.
     *    Donde cada documento contiene la meta data del la URL de la que proviene esa noticia.
     *
     * */
    const docs = pages.map(doc => this.split(doc)).flat(Infinity) as Document[]
    log(`📂 Loaded ${docs.length} Documents from ${this.path}`)

    /**
     * 7.- En este punto tiene una lista de documentos que un fragmento de texto y la URL de la que proviene.
     *
     *  [ Document({text, meta:{url, path}}) ]
     * */
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
