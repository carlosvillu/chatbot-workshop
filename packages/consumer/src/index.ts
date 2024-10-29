/* eslint @typescript-eslint/no-misused-promises: 0 */

import 'dotenv/config'

import debug from 'debug'

import {ChatOllama} from './chat/ollama/index.js'
import {OllamaEmbedder} from './embbeders/ollama/index.js'
import {ChromaProvider} from './vectorstores/Providers/Chroma.js'

// import {ChatOpenAI} from './chat/openai/index.js'
// import {OpenAIEmbedder} from './embbeders/openai/index.js'
// import {PineconeProvider} from './vectorstores/Providers/Pinecone.js'

const log = debug('workshop:consumer:main')

const [, , ...args] = process.argv

/**
 * 1.- Aquí vamos a generar el prompt para OpenAI
 *     Veras que solo es la suma de Instrucciones + Pregunta + Contexto (4 Parrafos de noticias)
 *
 *     Pruebalo con: npm run start -- "¿Como de altos son los precios de los pisos en Málaga?"
 * */
const [input] = args

async function main() {
  const embedder = OllamaEmbedder.create()
  const chat = ChatOllama.create({
    /**
     * 3.- Estos son los handler de la respuesta de chat, para que se vea algo en pantalla, lo dejamos vacio.
     *     lo veremos en la siguiente sección. Ahora centrate en el prompt.
     * */
    onToken() {},
    onEnd() {}
  })
  const provider = await ChromaProvider.create('chatbot')
  const question = await embedder.embbed(input)
  const results = await provider.search(question)

  /**
   * 2.- Le pasamos al chat tanto la pregunta como el contexto (results) para que internamos genere el prompt
   * */
  if (results == null) return log(`Not results found for ${question.question}`)

  await chat.ask(question, results)

  /**
   *
   *  10 .- LISTO tienes un bot que es capaz de responder a preguntas sobre un contexto. En este caso el contexto son las noticias de varios periódicos.
   *        Fíjate en la consola como internamente el chat mantiene el estado de la conversación. Para poder ofrecer la mejor respuesta en sus siguientes interacciones.
   *
   *        Ahora si puedes volver a la rama `master` y jugar con el bot en modo interactivo.
   *
   *        `git checkout master`
   *
   * */
  log(chat.toString())
}
main() // eslint-disable-line 
