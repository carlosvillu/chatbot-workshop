import {pipeline} from 'https://cdn.jsdelivr.net/npm/@xenova/transformers'
import debug from 'https://esm.sh/debug'

const log = debug('workshop:web:Chats:HFChat')

export class HFChat {
  static get MODEL() { return 'Xenova/distilbert-base-uncased-distilled-squad'} // eslint-disable-line
  static validate(id) {
    if (!id) throw new Error('[HFChat.validate] id is required')
  }

  static create(id) {
    HFChat.validate(id)
    return new HFChat(id)
  }

  constructor(id) {
    this._el = document.getElementById(id)
  }

  async chat(question, results) {
    this._el.innerHTML += `<p><mark>${question.question}</mark></p>`
    /**
     * 20 .- El chat lo hacemos en LOCAL !!!, aunque es verdad que es un poco 💩 la verdad. Pero dadle tiempo y que WebGPU funcione con todos los modelos.
     * */
    const generator = await pipeline('question-answering', HFChat.MODEL) // eslint-disable-line
    const {answer: text} = await generator(
      question.question, // aquí pasamos la pregunta
      results.map(result => result.record.metadata.text).join('. ') // y aquí pasamos todos los textos de las noticias que hemos encontrado. No es exactamente igual que lo del consumer, pero la idea es la misma No es exactamente igual que lo del consumer, pero la idea es la misma
    )
    log(`🔃 generated text: ${text}`)
    this._el.innerHTML += `<p>${text}</p>`
    return text
  }
}
