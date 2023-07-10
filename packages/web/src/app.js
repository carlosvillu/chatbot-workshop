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

loader.on('documents', async function (documents) {
  message.hidden = false
  const embedder = HFEmbedder.create(documents)

  for await (const embeddings of embedder.embeddings()) {
    log('🔃 Embeddings', embeddings)
    await provider.save(embeddings)
  }

  log('🏁 Done: We are ready to answer questions')
  input.disabled = false
  button.disabled = false
  load.hidden = true
  chatContainer.hidden = false
  questionContainer.hidden = false
  message.hidden = true
})

form.addEventListener('submit', async function (event) {
  event.preventDefault()

  input.disabled = true
  button.disabled = true

  const embedder = HFEmbedder.create([])

  const question = await embedder.question(input.value ?? '')
  input.value = ''
  log('❔Question', question)

  const results = await provider.search(question)
  log('🔍 Results', results.top(DOCUMENTS_BY_SEARCH))

  await chat.chat(question, results.top(DOCUMENTS_BY_SEARCH))

  input.disabled = false
  input.focus()
  button.disabled = false
})

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
