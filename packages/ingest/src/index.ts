import 'dotenv/config'

import debug from 'debug'
import {promises as fs} from 'node:fs'

import {TXTFolderLoader} from './documents/Loaders/TXTFolderLoader.js'
import {OpenAIEmbedder} from './embbeders/openai/index.js'
import {PineconeProvider} from './vectorstores/Providers/Pinecone.js'

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

const docs = await TXTFolderLoader.create(data).loadAndSplit()

const embedder = OpenAIEmbedder.create(docs)
/**
 * 2.- Aquí va el nombre del Indice que has creado en Pinecone
 * */
const vectorstore = await PineconeProvider.create('chatbot')

for await (const embeddings of embedder.embeddings()) {
  /**
   * 1 .- De la rama anterior conseguimos pasar de los documentos a los embeddings
   *      Ahora nos toca guardar los embeddings en el vectorstore. En este caso Pinecone.
   *
   *      Para ello necesitamos crear una cuenta en Pinecone y crear un vectorstore.
   *      https://app.pinecone.io/?sessionType=signup
   *
   *      Una vez creada la cuenta tienes que crear un Indice. Es importante recordar el nombre del Indice. lo tienes que en punto 2.
   *      Cuando tengas el índice creado tienes que escribir en el fichero .env el API_KEY y el Environment
   * */
  await vectorstore.save(embeddings)
}

/**
 *  5.- Listo ya lo has logrado, has guardado 46 vectores en la BD de Pinecone. 🥳🥳🥳🥳🥳
 *
 *  Recuerda: Texto -> Document -> Embedding -> Registro-> VectorStore
 * */
