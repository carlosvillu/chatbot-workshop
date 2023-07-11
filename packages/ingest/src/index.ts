import 'dotenv/config'

import debug from 'debug'
import {promises as fs} from 'node:fs'

import {TXTFolderLoader} from './documents/Loaders/TXTFolderLoader.js'

const log = debug('workshop:ingest:main')

const ALLOW_PROVIDERS = ['openai', 'hf']
const [, , ...args] = process.argv
const [provider, data] = args

if (!ALLOW_PROVIDERS.includes(provider)) {
  log(`🛑 Provider ${provider} not allowed. Allowed providers: ${ALLOW_PROVIDERS.join(', ')}`) // eslint-disable-line
  process.exit(1)
}
await fs.access(data).catch(() => {
  log(`🛑 File ${data} not found.`)
  process.exit(1)
})

/**
 *
 * 1.- El Objetivo de esta linea es crear una lista de documentos a partir de un directorio
 *    - El directorio debe contener archivos .txt
 *    - Cada archivo .txt debe contener una noticia.
 *    - Le pasamos al constructor del `Loader` el path absolutos del directorio que contiene las noticias.
 * */
const docs = await TXTFolderLoader.create(data).loadAndSplit()

log(` - ${docs.map(doc => doc.text).join('\n  - ')}`)

/**
 * 7.- Al final partiendo de solo 3 notcias llegamos a generar 46 Documentos.
 *   - Cada documento es un párrafo de una noticia.
 *   - No hay una regla fija sobre como partir un documentos es más arte que ciencia. Tal vez el origen del documento
 *   Sea código fuente, en ese caso no podemos partirlo por salto de linea y tendríamos que buscar otra estrategia.
 *
 * */

log(`✅ ${docs.length} documents loaded.`)
