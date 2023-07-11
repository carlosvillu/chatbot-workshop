import debug from 'https://esm.sh/debug'
import Idbkv from 'https://esm.sh/idb-kv'
import {ulid} from 'https://esm.sh/ulid'

import {Record} from '../Models/Record.js'
import {Result} from '../Models/Result.js'
import {Results} from '../Models/Results.js'

const log = debug('workshop:web:Providers:IDB')

export class IDB {
  static validate(index, namespace) {
    if (!index) throw new Error('[IDB.validate] index is required')
    if (!namespace) throw new Error('[IDB.validate] namespace is required')
  }

  static create(index, namespace = ulid()) {
    IDB.validate(index, namespace)
    return new IDB(index, namespace)
  }

  constructor(index, namespace) {
    this._index = index
    this._namespace = namespace
    this._db = new Idbkv(this._index)
    this._db.delete(this._namespace)
  }

  async save(embbedings) {
    /**
     *
     *  10.- Volvemos a crear los records que luego vamos a salvar en la base de datos.
     *       recuerda un record, no es más que un id random, un vector, en texto que lo generó y la url a la noticia.
     *
     * */
    const records = embbedings.map(embedding => {
      return Record.create(ulid(), embedding.vector, {
        text: embedding.doc.text,
        url: embedding.doc.meta.url
      })
    })

    let prevRecords = (await this._db.get(this._namespace)) ?? []
    prevRecords = prevRecords.map(json => Record.create.apply(null, Object.values(json)) ) // eslint-disable-line
    const recordsToSave = [...prevRecords, ...records].map(record => record.toJSON() ) // eslint-disable-line

    /**
     *
     * 11 .- Pero no necesitamos Pinecone realmente cualquier BD nos vale, hasta IndexedDB. Y guardamos todos los records totalmente en local. Fijate en la pestaña de Application de Chrome. en la sección de IndexedDB.
     *
     * */
    await this._db.set(this._namespace, recordsToSave)

    log(`💾 Saved ${records.length} vectors to ${this._namespace}`)
  }

  async search(question) {
    let records = (await this._db.get(this._namespace)) ?? []
    records = records.map(json => Record.create.apply(null, Object.values(json)) ) // eslint-disable-line

    /**
     * 15 .- Tiene un poco de truco, por que estamos generando una lista de resultado. Realmente no estamos buscando nada, solo estamos calculando la distancia entre el vector de la pregunta y todos los vectores que tenemos en la base de datos.
     *
     * fijate en /Models/Result.js
     *
     * */
    const results = records.map(record => Result.create(question, record))
    return Results.create(results)
  }
}
