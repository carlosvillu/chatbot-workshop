import {pipeline} from 'https://cdn.jsdelivr.net/npm/@xenova/transformers'
import debug from 'https://esm.sh/debug'
import EventEmitter from 'https://esm.sh/eventemitter3'

const log = debug('workshop:web:Audio:HFAudio')

export class HFAudio extends EventEmitter {
    static get MODEL() { return 'Xenova/whisper-small'} // eslint-disable-line
  static get OPTIONS() {return {mimeType: 'audio/webm'} } // eslint-disable-line

  static create() {
    return new HFAudio()
  }

  constructor() {
    super()
    this.mediaRecorder = null
    this.recordedChunks = []
  }

  async start() {
    const stream = await this._requestPermission()
    this.recordedChunks = []
    this.mediaRecorder = new MediaRecorder(stream, HFAudio.OPTIONS)
    this.mediaRecorder.addEventListener('dataavailable', this._dataavailable.bind(this)) // eslint-disable-line
    this.mediaRecorder.addEventListener('stop', this._stopHandler.bind(this)) // eslint-disable-line
    this.mediaRecorder.start()
  }

  stop() {
    this.mediaRecorder.stop()
  }

  async _requestPermission() {
    return navigator.mediaDevices.getUserMedia({audio: true})
  }

  _dataavailable(evt) {
    evt.data.size && this.recordedChunks.push(evt.data)
  }

  async _stopHandler() {
    const url = URL.createObjectURL(new Blob(this.recordedChunks))
    let transcriber = await pipeline('automatic-speech-recognition', HFAudio.MODEL) // eslint-disable-line
    const {text} = await transcriber(url, {language: 'spanish', task: 'translate'}) // eslint-disable-line
    this.emit('audio', text)
  }
}
