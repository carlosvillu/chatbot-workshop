/* eslint @typescript-eslint/no-misused-promises: 0 */

import 'dotenv/config'

import debug from 'debug'

import {ChatOpenAI} from './chat/openai/index.js'
import {OpenAIEmbedder} from './embbeders/openai/index.js'
import {PineconeProvider} from './vectorstores/Providers/Pinecone.js'

const log = debug('workshop:consumer:main')

const [, , ...args] = process.argv

/**
 * 1.- Aquí vamos a generar el prompt para OpenAI
 *     Veras que solo es la suma de Instrucciones + Pregunta + Contexto (4 Parrafos de noticias)
 *
 *     Pruebalo con: npm run start -- "¿Como de altos son los precios de los pisos en Málaga?"
 * */
const [input, namespace = '01H4RM2JD8QXE6N2Z7XFZPRZRD'] = args

const embedder = OpenAIEmbedder.create()
const chat = ChatOpenAI.create({
  /**
   * 3.- Estos son los handler de la respuesta de chat, para que se vea algo en pantalla, lo dejamos vacio.
   *     lo veremos en la siguiente sección. Ahora centrate en el prompt.
   * */
  onToken() {},
  onEnd() {}
})
const provider = await PineconeProvider.create('chatbot', namespace)
const question = await embedder.embbed(input)
const results = await provider.search(question)

/**
 * 2.- Le pasamos al chat tanto la pregunta como el contexto (results) para que internamos genere el prompt
 * */
results != null && (await chat.ask(question, results))

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
