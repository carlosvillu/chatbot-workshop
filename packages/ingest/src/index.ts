import 'dotenv/config'

import debug from 'debug'
import {promises as fs} from 'node:fs'

import {TXTFolderLoader} from './documents/Loaders/TXTFolderLoader.js'
import {OllamaEmbedder} from './embbeders/ollama/index.js'
import {OpenAIEmbedder} from './embbeders/openai/index.js'

const log = debug('workshop:ingest:main')

const ALLOW_PROVIDERS = ['openai', 'ollama', 'hf']
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

const docs = await TXTFolderLoader.create(data).loadAndSplit()

/**
 * 1.- Ahora pongamos el foco en el embedding.
 *     En la rama anterios vimos como partiendo de solo 3 noticias llegamos a generar 46 documentos que están como
 *     array en la variable `docs`
 *     Ahora vamos a generar los embeddings de cada documento. Para ello vamos a usar la clase `OllamaEmbedder` y usaremos
 *     modelo local cargado mediante OLLAMA (https://ollama.com/) [ VUELTA A LA SLIDES ]
 * */
const embedder =
  provider === 'ollama'
    ? OllamaEmbedder.create(docs)
    : OpenAIEmbedder.create(docs)

/**
 *
 * 2.- Esta es una función un poco especial, es una generador asíncrono, es decir, es una función que se puede iterar y en cada iteración no va
 *     a devolver un array con bloques de 10 embeddings de los 46 con los que hemos inicializado la clase.
 *
 * */
for await (const embeddings of embedder.embeddings()) {
  /**
   * 9.- Fijate como en la consola los logs van saliendo de 10 en 10.
   * */
  log(`📦 Vector: ${embeddings[0].vector.length}`)
  log(`📄 Text: ${embeddings[0].doc.text}`)
  log(`📦 Embeddings: ${embeddings.length} `)

  /**
   * 10 .- Un vector no es más que un array de logitud 768 y un montón de números.
   * Si solo fueran 3 podríamos representarlos en una cubo, pero como son 768 nos lo tenemos que imaginar :P
   * */
  // log(`📦 Vector: ${embeddings[0].vector.toString()}`)
}
