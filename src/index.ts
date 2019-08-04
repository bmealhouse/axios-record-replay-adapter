import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import {promisify} from 'util'
import axios, {
  AxiosAdapter,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios'

let defaultAdapter: AxiosAdapter | undefined
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

interface AxiosRecordReplayAdapterOptions {
  axiosInstance?: AxiosInstance
  recordingsDir?: string
  createRequest?(config: AxiosRequestConfig): any
  createResponse?(response: AxiosResponse): any
}

function defaultCreateRequest(requestConfig: AxiosRequestConfig): any {
  return {
    method: requestConfig.method,
    path: new URL(requestConfig.url!).pathname,
    data: requestConfig.data,
  }
}

function defaultCreateResponse(response: AxiosResponse): any {
  return {
    status: response.status,
    statusText: response.statusText,
    data: response.data,
  }
}

export default (
  options: AxiosRecordReplayAdapterOptions = {},
): (() => void) => {
  const {
    axiosInstance = axios,
    recordingsDir = './recordings',
    createRequest = defaultCreateRequest,
    createResponse = defaultCreateResponse,
  } = options

  try {
    fs.mkdirSync(path.resolve(process.cwd(), recordingsDir))
  } catch {}

  defaultAdapter = axiosInstance.defaults.adapter
  axiosInstance.defaults.adapter = axiosRecordReplayAdapter

  return () => {
    axiosInstance.defaults.adapter = defaultAdapter
  }

  async function axiosRecordReplayAdapter(
    config: AxiosRequestConfig,
  ): Promise<any> {
    const request = createRequest(config)

    if (!request.path) {
      throw new Error(
        'createRequest() must return an object with a "path" property.',
      )
    }

    const filepath = generateFilepath(request)

    try {
      const {response} = JSON.parse(await readFile(filepath, 'utf8'))
      return {config, ...response, data: JSON.stringify(response.data)}
    } catch {}

    const response = await defaultAdapter!(config)

    // If we make it to this point in CI, our recordings are out of date.
    // Notify the developer to update recordings.
    if (
      process.env.CI &&
      !(
        process.env.npm_package_repository_url &&
        process.env.npm_package_repository_url.includes(
          'bmealhouse/axios-record-replay-adapter',
        )
      )
    ) {
      throw new Error('Recordings out of date, please update.')
    }

    await writeFile(filepath, createFileContents(request, response))
    return response
  }

  function generateFilepath(request: any): string {
    const endpoint = request.path.replace(/\//g, '-').substr(1)

    const hash = crypto.createHash('md5')
    hash.update(JSON.stringify(request))

    return path.resolve(
      process.cwd(),
      recordingsDir,
      `./${endpoint}_${hash.digest('hex')}.json`,
    )
  }

  function createFileContents(req: any, res: AxiosResponse): string {
    const response = createResponse(res)
    return JSON.stringify(
      {
        request: {
          ...req,
          data: safeJsonParse(req.data),
        },
        response: {
          ...response,
          data: safeJsonParse(response.data),
        },
      },
      null,
      2,
    )
  }
}

function safeJsonParse(data: string): any {
  try {
    return JSON.parse(data)
  } catch {
    return Buffer.isBuffer(data) ? '[Buffer]' : data
  }
}
