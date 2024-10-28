import debug from 'debug'
import {ulid} from 'ulid'

import {PineconeClient} from '@pinecone-database/pinecone'
import type {VectorOperationsApi} from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch/index.js'

import type {Embedding} from '../../embbeders/Models/Embbeding.js'
import {Record} from '../Models/Record.js'

const {PINECONE_API_KEY = '', PINECONE_ENVIRONMENT = ''} = process.env
const log = debug('workshop:ingest:vectorstores:PineconeProvider')

export class PineconeProvider {
  static validate(index: string): void {
    if (typeof index !== 'string') {
      throw new Error(`[PineconeProvider.validate] Invalid index type ${typeof index}`)
    }
  }

  static async create(index: string, namespace: string = ulid()): Promise<PineconeProvider> {
    PineconeProvider.validate(index)
    const client = new PineconeClient()
    await client.init({
      apiKey: PINECONE_API_KEY,
      environment: PINECONE_ENVIRONMENT
    })

    return new PineconeProvider(client.Index(index), namespace)
  }

  constructor(private readonly index: VectorOperationsApi, private readonly namespace: string) {}

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

    /**
     * 4.- Solo la forma que tiene la librería de NodeJS de guardar un registro en Pinecone.
     *     https://docs.pinecone.io/docs/node-client#indexupsert
     * */
    await this.index
      .upsert({
        upsertRequest: {
          vectors: records.map(record => record.toJSON()),
          namespace: this.namespace // El namespace es algo especial de Pinecone y nos permite agrupar grupos de registros. Es útil para separar los registros de entrenamiento de los de producción por ejemplo.
        }
      })
      .then(() => log(`💾 Saved ${records.length} vectors to ${this.namespace}`))
      .catch((error: Error) => log(`❌ ${error.message}`))
  }
}
