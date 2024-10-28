/* eslint @typescript-eslint/restrict-template-expressions:0 */

import {ChromaClient} from 'chromadb'
import debug from 'debug'
import {ulid} from 'ulid'

import type {Embedding} from '../../embbeders/Models/Embbeding.js'
import {Record} from '../Models/Record.js'

const log = debug('workshop:ingest:vectorstores:ChromaProvider')

export class ChromaProvider {
  static validate(collection: string): void {
    if (typeof collection !== 'string') {
      throw new Error(`[ChromaProvider.validate] Invalid collection type ${typeof collection}`)
    }
  }

  static async create(collection: string): Promise<ChromaProvider> {
    ChromaProvider.validate(collection)
    const client = new ChromaClient({
      path: 'http://localhost:8000'
    })

    const col = await client.getOrCreateCollection({
      name: collection
    })

    return new ChromaProvider(col)
  }

  constructor(private readonly collection: any) {}

  async save(embeddings: Embedding[]): Promise<void> {
    /**
     * 3.- Convertimos cada uno de los embeddings en un Registro.
     *     Básicamente un registro es un Modelo que contiene un ID aleatorio (Recueda que no buscamos por ID), un vector, el texto que ha generado ese vector y la URL del documento.
     *     Los registros que guardamos en la vector store, pueden contener cualquier información pero como mínimo deben contener un vector y el texto que los ha generado.
     *     En este caso estoy guardando tambien la URL de la noticia para poder mostrarla en el chat como parte de la respuesta del bot.
     * */
    const records = embeddings.map(embedding => {
      return Record.create(ulid(), embedding.vector, {
        text: embedding.doc.text,
        url: embedding.doc.meta.URL as string
      })
    })

    try {
      /**
       * 4.- Solo la forma que tiene la librería de NodeJS de guardar un registro en Chroma.
       * https://docs.trychroma.com/getting-started#4.-add-some-text-documents-to-the-collection
       * */
      await this.collection.add({
        ids: records.map(r => r.id),
        embeddings: records.map(r => r.values),
        metadatas: records.map(r => r.metadata),
        documents: records.map(r => r.metadata.text)
      })
      log(`💾 Saved ${records.length} vectors to collection ${this.collection.name}`)
    } catch (error) {
      log(`❌ ${(error as Error).message}`)
    }
  }
}
