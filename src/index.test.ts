import * as fs from "fs";
import * as http from "http";
import { AddressInfo } from "net";
import axios from "axios";
import { useAxiosRecordReplayAdapter } from ".";

const user = {
  data: {
    id: 7,
    email: "michael.lawson@reqres.in",
    first_name: "Michael",
    last_name: "Lawson",
    avatar: "https://reqres.in/img/faces/7-image.jpg",
  },
  support: {
    url: "https://reqres.in/#support-heading",
    text:
      "To keep ReqRes free, contributions towards server costs are appreciated!",
  },
};

let server: http.Server;
let baseURL: string;

const format = (data: string | Record<string, unknown>): string => {
  if (typeof data !== "string") {
    data = JSON.stringify(data, null, 2);
  }

  return data.replace(/"/g, "’");
};

beforeAll((done) => {
  server = http
    .createServer((_request, response) => {
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify(user));
    })
    .listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      baseURL = `http://127.0.0.1:${port}`;
      done();
    });
});

afterAll((done) => {
  server.close(done);
});

afterEach(() => {
  try {
    const recordings = fs
      .readdirSync("./recordings")
      .map((filename) => `./recordings/${filename}`);

    recordings.forEach((recording) => {
      fs.unlinkSync(recording);
    });

    fs.rmdirSync("./recordings");
  } catch {}
});

test("creates the default recordings directory", () => {
  // act
  useAxiosRecordReplayAdapter({
    axiosInstance: axios.create(),
  });

  // assert
  expect(fs.existsSync("./recordings")).toBeTruthy();
});

test("creates a custom recordings directory", () => {
  // arrange
  const recordingsDir = "./src/recordings";

  // act
  useAxiosRecordReplayAdapter({
    axiosInstance: axios.create(),
    recordingsDir,
  });

  // assert
  expect(fs.existsSync(recordingsDir)).toBeTruthy();
  fs.rmdirSync(recordingsDir);
});

test("creates a recording with default filename", async () => {
  // arrange
  const axiosInstance = axios.create();
  useAxiosRecordReplayAdapter({ axiosInstance });

  // act
  const { data } = await axiosInstance.get(`${baseURL}/api/users/7`);

  // assert
  const [recording] = fs.readdirSync("./recordings");
  expect(recording).toMatchInlineSnapshot(
    `"1ab499d565acf87f67ac738631d42d07.json"`
  );

  const recordingContents = fs.readFileSync(
    `./recordings/${recording}`,
    "utf8"
  );
  expect(JSON.parse(recordingContents).response.data).toEqual(data);

  expect(format(recordingContents)).toMatchInlineSnapshot(`
    "{
      ’request’: {
        ’method’: ’get’,
        ’path’: ’/api/users/7’
      },
      ’response’: {
        ’status’: 200,
        ’statusText’: ’OK’,
        ’data’: {
          ’data’: {
            ’id’: 7,
            ’email’: ’michael.lawson@reqres.in’,
            ’first_name’: ’Michael’,
            ’last_name’: ’Lawson’,
            ’avatar’: ’https://reqres.in/img/faces/7-image.jpg’
          },
          ’support’: {
            ’url’: ’https://reqres.in/#support-heading’,
            ’text’: ’To keep ReqRes free, contributions towards server costs are appreciated!’
          }
        }
      }
    }"
  `);
});

test("creates a recording with filename prefix", async () => {
  // arrange
  const axiosInstance = axios.create();

  useAxiosRecordReplayAdapter({
    axiosInstance,
    buildFilenamePrefix(request) {
      return request.path.replace(/\//g, "-").slice(1);
    },
  });

  // act
  await axiosInstance.get(`${baseURL}/api/users/7`);

  // assert
  const [recording] = fs.readdirSync("./recordings");
  expect(recording).toMatchInlineSnapshot(
    `"api-users-7_1ab499d565acf87f67ac738631d42d07.json"`
  );
});

test("returns a cached response when a recording exists", async () => {
  // arrange
  const axiosInstance = axios.create({ baseURL });

  const spy = jest.fn(axiosInstance.defaults.adapter);
  axiosInstance.defaults.adapter = spy;

  // act
  useAxiosRecordReplayAdapter({ axiosInstance });
  await axiosInstance.get("/api/users/7");
  await axiosInstance.get("/api/users/7");
  await axiosInstance.get("/api/users/7");

  // assert
  expect(spy).toHaveBeenCalledTimes(1);
});

test("records a custom request", async () => {
  // arrange
  const axiosInstance = axios.create();

  useAxiosRecordReplayAdapter({
    axiosInstance,
    buildRequest(requestConfig) {
      return { path: new URL(requestConfig.url!).pathname };
    },
  });

  // act
  await axiosInstance.get(`${baseURL}/api/users/7`);

  // assert
  const [recording] = fs.readdirSync("./recordings");
  const { request } = JSON.parse(
    fs.readFileSync(`./recordings/${recording}`, "utf8")
  );

  expect(format(request)).toMatchInlineSnapshot(`
    		"{
    		  ’path’: ’/api/users/7’
    		}"
  	`);
});

test("create a custom reponse", async () => {
  // arrange
  const axiosInstance = axios.create();

  useAxiosRecordReplayAdapter({
    axiosInstance,
    buildResponse() {
      return { data: Buffer.from(new ArrayBuffer(128)) };
    },
  });

  // act
  await axiosInstance.get(`${baseURL}/api/users/7`);

  // assert
  const [recording] = fs.readdirSync("./recordings");
  const { response } = JSON.parse(
    fs.readFileSync(`./recordings/${recording}`, "utf8")
  );

  expect(format(response)).toMatchInlineSnapshot(`
    		"{
    		  ’data’: ’[Buffer]’
    		}"
  	`);
});

test("restores default axios adapter", () => {
  // arrange
  const defaultAdapter = axios.defaults.adapter;

  // act
  const restoreDefaultAdapater = useAxiosRecordReplayAdapter();

  // assert
  expect(axios.defaults.adapter).not.toBe(defaultAdapter);

  // act
  restoreDefaultAdapater();

  // assert
  expect(axios.defaults.adapter).toBe(defaultAdapter);
});
