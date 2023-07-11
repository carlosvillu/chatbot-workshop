/* eslint @typescript-eslint/no-misused-promises: 0 */

import 'dotenv/config'

import debug from 'debug'

import {OpenAIEmbedder} from './embbeders/openai/index.js'
import {PineconeProvider} from './vectorstores/Providers/Pinecone.js'

const log = debug('workshop:consumer:main')

const [, , ...args] = process.argv

/**
 * 1.- Del punto anterior conseguimos generar el embedding de la pregunta que le pasamos por consola.
 *     Vamos a volver a usar la consola para pasarle la pregunta pero ahora además vamos ausar ese vector para
 *     buscar los 4 más simirales de los 46 que hay guardados en Pinecone
 *
 *     Ejemplo de uso: npm run start -- "¿ Como de altos son los precios de los pisos en Málaga ?"
 *
 * */
const [input, namespace = '01H4RM2JD8QXE6N2Z7XFZPRZRD'] = args

const provider = await PineconeProvider.create('chatbot', namespace)

const embedder = OpenAIEmbedder.create()

/**
 * 2.- Recuerda aquí le pasamos la pregunta que queremos buscar y nos devuelve un vector de 1536 dimensiones.
 * */
const question = await embedder.embbed(input)

/**
 * 3.- Aquí hacemos la búsqueda en Pinecone y nos devuelve los 4 más similares.
 * */
const results = await provider.search(question)

/**
 * 7.- Fijate en la salida de consola (Igual el modelo no es el mejor pero es lo que hay). El punto es que tenemos 4 parrafos de entre los 46 que teníamos que son
 *     semánticamente relevantes a la pregunta que le hemos pasado. ❤️❤️❤️❤️
 * */
log(results)
