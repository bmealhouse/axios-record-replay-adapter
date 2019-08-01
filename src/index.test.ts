import fs from 'fs'
import axios from 'axios'
import useAxiosRecordReplayAdapter from '.'

const format = (data: string): string => {
  return data.replace(/"/g, "'")
}

afterAll(() => {
  const recordings = fs
    .readdirSync('./recordings')
    .map(filename => `./recordings/${filename}`)

  recordings.forEach(fs.unlinkSync)
  fs.rmdirSync('./recordings')
})

test('creates the default "./recordings" directory', () => {
  useAxiosRecordReplayAdapter({
    axiosInstance: axios.create(),
  })

  expect(fs.existsSync('./recordings')).toBeTruthy()
})

test('creates a custom "./src/recordings" directory', () => {
  const recordingsDir = './src/recordings'
  useAxiosRecordReplayAdapter({
    axiosInstance: axios.create(),
    recordingsDir,
  })

  expect(fs.existsSync(recordingsDir)).toBeTruthy()
  fs.rmdirSync(recordingsDir)
})

test('creates a recording when calling https://jsonplaceholder.typicode.com/todos/1', async () => {
  const axiosInstance = axios.create()
  useAxiosRecordReplayAdapter({axiosInstance})

  const {data} = await axiosInstance.get(
    'https://jsonplaceholder.typicode.com/todos/1',
  )

  const [recording] = fs.readdirSync('./recordings')
  expect(recording).toMatchInlineSnapshot(
    `"todos-1_3439973d2c1ff6cc118d7af4cf797551.json"`,
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
