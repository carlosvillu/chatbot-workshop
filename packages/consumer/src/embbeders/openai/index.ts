import debug from 'debug'
import https from 'node:https'

import {Question} from '../Models/Question.js'

const {OPENAI_API_KEY = 'sk-'} = process.env
const log = debug('workshop:consumer:Embbeders:OpenAIEmbedder')

export class OpenAIEmbedder {
  static MODEL = 'text-embedding-ada-002'
  static OPTIONS = {
    hostname: 'api.openai.com',
    port: 443,
    path: '/v1/embeddings',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`
    }
  }

  static create(): OpenAIEmbedder {
    return new OpenAIEmbedder()
  }

  async embbed(question: string): Promise<Question> {
    const response = await this.request(question)
    const json = JSON.parse(response)
    const vector = json?.data?.[0]?.embedding
    log(`🔃 vector generated for question: ${question}`)
    return Question.create(question, vector)
  }

  async request(question: string): Promise<string> {
    return await new Promise((resolve, reject) => {
      const req = https.request(OpenAIEmbedder.OPTIONS, res => {
        let body = ''
        req.on('error', error => {
          log(`[❌] => (${error.message})`)
          reject(error)
        })
        res.on('data', data => {
          body += data.toString() as string
        })
        res.on('end', () => {
          try {
            resolve(body)
          } catch (error) {
            // @ts-expect-error
            // eslint-disable-next-line
            log(`[❌] => (${error.message})`)
          }
        })
      })
      req.write(JSON.stringify({input: question, model: OpenAIEmbedder.MODEL}))
      req.end()
    })
  }
}
