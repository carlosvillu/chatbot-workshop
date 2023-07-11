import debug from 'https://esm.sh/debug'

import {HFAudio} from './Audio/HFAudio.js'
import {HFChat} from './Chats/HFChat.js'
import {HFEmbedder} from './Embedders/HFEmbbeder.js'
import {DragAndDropTXTFilesLoader} from './Loaders/DragAndDropTXTFilesLoader.js'
import {IDB} from './Providers/IDB.js'

debug.enable('*')

const NAMESPACE = 'EMBBEDINGS'
const DOCUMENTS_BY_SEARCH = 4

const log = debug('workshop:web:app')
const input = document.getElementById('question')
const button = document.getElementById('submit')
const form = document.getElementById('form')
const load = document.getElementById('load')
const chatContainer = document.getElementById('chat')
const questionContainer = document.getElementById('question-container')
const message = document.getElementById('message')
const recordingLabel = document.getElementById('recording-label')

const chat = HFChat.create('chat')
const loader = DragAndDropTXTFilesLoader.create('dropzone')
const provider = IDB.create('chatbot', NAMESPACE)
const audio = HFAudio.create()

/**
 * 1 .- Cuando el usuario arrastra los archivos TXT, el loader los rompe en cachitos igual que hemos visto en la sección de Ingest.
 *      Puede verlo en Loaders/DragAndDropTXTFilesLoader.js
 *
 *      Para ayudarte, puedes encontrar un par de txt de ejemplo en la carpeta ./example
 *      Estos modelos que corren nativamente en el navegador son mucho más limitados que los que podemos usar con la API de OpenAI. Por lo que solo aceptan textos en ingles y preguntas en ingles.
 *
 *      NO TE OLVIDES DE ABRIR LAS DEVTOOLS CON EL PANEL DE NETWOTK Y LA CONSOLA.
 *      Por cierto cuando veas la consola, cambia Default Level, por Verbose. Así verás todos los logs.
 * */
loader.on('documents', async function (documents) {
  message.hidden = false
  const embedder = HFEmbedder.create(documents)

  /**
   *
   * 4.- Hacemos lo mismo que hemos hecho en el Ingest. A cada documento le creamos su embedding
   *     fijate en /Embedders/HFEmbbeder.js
   *
   * */
  for await (const embeddings of embedder.embeddings()) {
    log('🔃 Embeddings', embeddings)

    /**
     *  9.- Una vez que tenemos los embeddings (OJO: Generados en local 🤯), los guardamos en la base de datos. Fijate en /Providers/IDB.js
     * */
    await provider.save(embeddings)
  }

  log('🏁 Done: We are ready to answer questions')

  // Cosas para que quede bonita la web, nada importante.
  input.disabled = false
  button.disabled = false
  load.hidden = true
  chatContainer.hidden = false
  questionContainer.hidden = false
  message.hidden = true
})

/**
 * 12 .- Una vez que buscamos algo en el formulario, empieza la parte del "consumer" que hemos visto antes.
 * */
form.addEventListener('submit', async function (event) {
  event.preventDefault()

  input.disabled = true
  button.disabled = true

  const embedder = HFEmbedder.create([])

  /**
   *
   *  13.- Igual, pillamos la pregunta y la convertimos en embedding. Ya hemos visto como lo hacemos en local. Pues esto es lo mismo.
   *
   * */
  const question = await embedder.question(input.value ?? '')
  input.value = ''
  log('❔Question', question)

  /**
   *
   *  14.- Y le decimos a nuestra BD que busque la respuesta más parecida a la pregunta que hemos hecho.
   *  Fijate en /Providers/IDB.js
   *
   * */
  const results = await provider.search(question)
  log('🔍 Results', results.top(DOCUMENTS_BY_SEARCH))

  /**
   * 18.- Es la lista de resultados quien me va a devolver los 4 más próximos a la pregunta. Y eso lo se, gracias a la propiedad distante que tiene cada modelo Result.
   *      Y ahora como hemos visto antes, le pasamos al chat, la pregunta y el contexto, que son los resultados que hemos encontrado.
   *
   *      fijate en /Chats/HFChat.js
   * */
  await chat.chat(question, results.top(DOCUMENTS_BY_SEARCH))

  input.disabled = false
  input.focus()
  button.disabled = false
})

/**
 *
 * 21.- Esta parte es un poco flipada, échale un ojo a /Audio/HFAudio.js
 * Pero no lo voy a comentar
 *
 * */
let startRecording = true
document
  .querySelector('#recording')
  .addEventListener('click', async function (event) {
    event.preventDefault()
    if (startRecording) {
      recordingLabel.innerText = '👂 Recording...'
      audio.start()
    } else {
      recordingLabel.innerText = '🧠 Pensando...'
      audio.stop()
    }
    startRecording = !startRecording
  })

audio.on('audio', async audio => {
  recordingLabel.innerText = '🎙️ Grabar'
  input.value = audio
  log('🎙️ Audio', audio)
})

/**
 *
 * 22.- Y hasta aquí el workshop. Espero que te haya gustado y que te haya servido para entender un poco mejor como funcionan los modelos de lenguaje.
 *     Si tienes cualquier duda, puedes escribirme por Slack
 *
 * */
