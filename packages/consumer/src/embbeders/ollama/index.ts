import debug from 'debug'

import {Question} from '../Models/Question.js'

const log = debug('workshop:consumer:Embbeders:OllamaEmbedder')

export class OllamaEmbedder {
  /**
   * 2.- Toda esta parte es igual a lo que ya hemos visto en la secciónd de ingest.
   *    Así que no me voy a parar mucho en explicarla.
   * */
  static MODEL = 'nomic-embed-text'
  static HOST = 'http://localhost:11434'

  static create(): OllamaEmbedder {
    return new OllamaEmbedder()
  }

  async embbed(question: string): Promise<Question> {
    /**
     * 3.- Aquí es donde hacemos la petición a Ollama para que nos genere el vector.
     *     Recuerda le pasamos una cadena de texto y nos devuelve un vector de 768 dimensiones.
     * */
    const vector = await this.request(question)
    log(`🔃 vector generated for question: ${question}`)

    /**
     * 4.- Generamos un modelo que encapsula la pregunta y el vector generado.
     * */
    return Question.create(question, vector)
  }

  /**
   * Nada interesante aquí solo hacemos una petición a la API de Ollama.
   * Pero vamos a ver la salida del servidor de Ollama para entender mejor que está pasando por detrás
   * */
  private async request(question: string): Promise<number[]> {
    const response = await fetch(`${OllamaEmbedder.HOST}/api/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OllamaEmbedder.MODEL,
        prompt: 'search_query: ' + question
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.embedding
  }
}
