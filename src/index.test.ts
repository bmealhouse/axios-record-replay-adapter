/* eslint-disable @typescript-eslint/quotes */
import fs from 'fs'
import axios from 'axios'
import useAxiosRecordReplayAdapter from '.'

const format = (data: string | object): string => {
  if (typeof data !== 'string') {
    data = JSON.stringify(data, null, 2)
  }

  return data.replace(/"/g, "'")
}

afterEach(() => {
  try {
    const recordings = fs
      .readdirSync('./recordings')
      .map(filename => `./recordings/${filename}`)

    recordings.forEach(fs.unlinkSync)
    fs.rmdirSync('./recordings')
  } catch {}
})

test('creates the default recordings directory', () => {
  useAxiosRecordReplayAdapter({
    axiosInstance: axios.create(),
  })
  expect(fs.existsSync('./recordings')).toBeTruthy()
})

test('creates a custom recordings directory', () => {
  const recordingsDir = './src/recordings'

  useAxiosRecordReplayAdapter({
    axiosInstance: axios.create(),
    recordingsDir,
  })

  expect(fs.existsSync(recordingsDir)).toBeTruthy()
  fs.rmdirSync(recordingsDir)
})

test('creates a recording with default filename', async () => {
  const axiosInstance = axios.create()
  useAxiosRecordReplayAdapter({axiosInstance})

  const {data} = await axiosInstance.get(
    'https://jsonplaceholder.typicode.com/todos/1',
  )

  const [recording] = fs.readdirSync('./recordings')
  expect(recording).toMatchInlineSnapshot(
    `"3439973d2c1ff6cc118d7af4cf797551.json"`,
  )

  const recordingContents = fs.readFileSync(`./recordings/${recording}`, 'utf8')
  expect(JSON.parse(recordingContents).response.data).toEqual(data)

  expect(format(recordingContents)).toMatchInlineSnapshot(`
    "{
      'request': {
        'method': 'get',
        'path': '/todos/1'
      },
      'response': {
        'status': 200,
        'statusText': 'OK',
        'data': {
          'userId': 1,
          'id': 1,
          'title': 'delectus aut autem',
          'completed': false
        }
      }
    }"
  `)
})

test('creates a recording with filename prefix', async () => {
  const axiosInstance = axios.create()

  useAxiosRecordReplayAdapter({
    axiosInstance,
    buildFilenamePrefix(request) {
      return request.path.replace(/\//g, '-').slice(1)
    },
  })

  await axiosInstance.get('https://jsonplaceholder.typicode.com/todos/1')

  const [recording] = fs.readdirSync('./recordings')
  expect(recording).toMatchInlineSnapshot(
    `"todos-1_3439973d2c1ff6cc118d7af4cf797551.json"`,
  )
})

test('returns a cached response when a recording exists', async () => {
  const axiosInstance = axios.create({
    baseURL: 'https://jsonplaceholder.typicode.com',
  })

  const spy = jest.spyOn(axiosInstance.defaults, 'adapter')

  useAxiosRecordReplayAdapter({axiosInstance})
  await axiosInstance.get('/todos/1')
  await axiosInstance.get('/todos/1')
  await axiosInstance.get('/todos/1')

  expect(spy).toHaveBeenCalledTimes(1)
})

test('records a custom request', async () => {
  const axiosInstance = axios.create()

  useAxiosRecordReplayAdapter({
    axiosInstance,
    buildRequest(requestConfig) {
      return {path: new URL(requestConfig.url!).pathname}
    },
  })

  await axiosInstance.get('https://jsonplaceholder.typicode.com/todos/1')
  const [recording] = fs.readdirSync('./recordings')
  const {request} = JSON.parse(
    fs.readFileSync(`./recordings/${recording}`, 'utf8'),
  )

  expect(format(request)).toMatchInlineSnapshot(`
    "{
      'path': '/todos/1'
    }"
  `)
})

test('create a custom reponse', async () => {
  const axiosInstance = axios.create()

  useAxiosRecordReplayAdapter({
    axiosInstance,
    buildResponse(_response) {
      return {data: Buffer.from(new ArrayBuffer(128))}
    },
  })

  await axiosInstance.get('https://jsonplaceholder.typicode.com/todos/1')
  const [recording] = fs.readdirSync('./recordings')
  const {response} = JSON.parse(
    fs.readFileSync(`./recordings/${recording}`, 'utf8'),
  )

  expect(format(response)).toMatchInlineSnapshot(`
    "{
      'data': '[Buffer]'
    }"
  `)
})

test('restores default axios adapter', () => {
  const defaultAdapter = axios.defaults.adapter

  const restoreDefaultAdapater = useAxiosRecordReplayAdapter()
  expect(axios.defaults.adapter).not.toBe(defaultAdapter)

  restoreDefaultAdapater()
  expect(axios.defaults.adapter).toBe(defaultAdapter)
})
