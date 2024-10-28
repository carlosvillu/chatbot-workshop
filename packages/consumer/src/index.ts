/* eslint @typescript-eslint/no-misused-promises: 0 */

import 'dotenv/config'

import debug from 'debug'

import {OllamaEmbedder} from './embbeders/ollama/index.js'
// import {OpenAIEmbedder} from './embbeders/openai/index.js'

const log = debug('workshop:consumer:main')

/**
 * 1.- Lo primero que tenemos que hacer es obtener la pregunta que le queremos al bot
 *    Por ahora la vamos a pillar del los argumentos de la consola
 *
 *    npm run start -- "¿Como de altos son los precios de los pisos en Málaga?"
 *
 * */
const [, , q] = process.argv

const embedder = OllamaEmbedder.create()
const question = await embedder.embbed(q)

/**
 * 5.- Imprimimos la pregunta y el vector generado.
 *     Y listo ya tenemos la primera parte del consumer. Un vector para la pregunta. 🎉
 *     Ahora deberíamos usar ese vector para buscar en el vectorstore los 4 vectores más próximos. Recordemos que
 *     vamos usar la distancia coseno para medir la similitud entre vectores.
 * */
log(question)
