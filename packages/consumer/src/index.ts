/* eslint @typescript-eslint/no-misused-promises: 0 */

import 'dotenv/config'

import readline from 'readline'

import debug from 'debug'

import {ChatOllama} from './chat/ollama/index.js'
import {OllamaEmbedder} from './embbeders/ollama/index.js'
import {ChromaProvider} from './vectorstores/Providers/Chroma.js'

// import {ChatOpenAI} from './chat/openai/index.js'
// import {OpenAIEmbedder} from './embbeders/openai/index.js'
// import {PineconeProvider} from './vectorstores/Providers/Pinecone.js'

const log = debug('workshop:consumer:main')

const [, , ...args] = process.argv
const [verbose] = args

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const embedder = OllamaEmbedder.create()
const chat = ChatOllama.create({
  onToken(token) {
    process.stdout.write(token)
  },
  onEnd() {
    process.stdout.write('\n\n----------------------------------------\n\n')
    if (verbose !== undefined) {
      process.stdout.write(chat.toString())
      process.stdout.write('\n\n----------------------------------------\n\n')
    }
  }
})
const provider = await ChromaProvider.create('chatbot')

log('\n🤘chat start\n')
const loop = async (): Promise<void> => {
  rl.question('👉 ', async function (input: string): Promise<void> {
    const question = await embedder.embbed(input)
    const results = await provider.search(question)

    if (results == null) {
      log('❌ No results found')
      process.exit(1)
    }

    await chat.ask(question, results)
    await loop()
  })
}
loop().catch(log)
