import 'dotenv/config'

import debug from 'debug'
import {promises as fs} from 'node:fs'

import {TXTFolderLoader} from './documents/Loaders/TXTFolderLoader.js'
import {OllamaEmbedder} from './embbeders/ollama/index.js'
import {OpenAIEmbedder} from './embbeders/openai/index.js'
import {ChromaProvider} from './vectorstores/Providers/Chroma.js'
import {PineconeProvider} from './vectorstores/Providers/Pinecone.js'

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

const embedder =
  provider === 'ollama'
    ? OllamaEmbedder.create(docs)
    : OpenAIEmbedder.create(docs)

/**
 * 2.- Aquí va el nombre del Indice que ha de crear Chroma
 * */
const vectorstore =
  provider === 'ollama'
    ? await ChromaProvider.create('chatbot')
    : await PineconeProvider.create('chatbot')

for await (const embeddings of embedder.embeddings()) {
  /**
   * 1 .- De la rama anterior conseguimos pasar de los documentos a los embeddings
   *      Ahora nos toca guardar los embeddings en el vectorstore. En este caso ChromaDB.
   *
   *      Para ello necesitamos levantar la bbdd en local usando docker compose
   *      $ docker compose up
   *
   *      Una vez levantado el entorno tenemos que visitar http://localhost:3000
   *
   * */
  await vectorstore.save(embeddings)
}

/**
 *  5.- Listo ya lo has logrado, has guardado 46 vectores en la BD de Chroma. 🥳🥳🥳🥳🥳
 *
 *  Recuerda: Texto -> Document -> Embedding -> Registro-> VectorStore
 * */
