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
const vectorstore = await PineconeProvider.create('chatbot')

for await (const embeddings of embedder.embeddings()) {
  await vectorstore.save(embeddings)
}
