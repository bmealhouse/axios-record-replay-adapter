import * as fs from "fs";
import axios from "axios";
import useAxiosRecordReplayAdapter from ".";

const format = (data: string | Record<string, unknown>): string => {
  if (typeof data !== "string") {
    data = JSON.stringify(data, null, 2);
  }

  return data.replace(/"/g, "’");
};

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
  useAxiosRecordReplayAdapter({
    experimental_ioTiming: true,
    axiosInstance: axios.create(),
  });
  expect(fs.existsSync("./recordings")).toBeTruthy();
});

test("creates a custom recordings directory", () => {
  const recordingsDir = "./src/recordings";

  useAxiosRecordReplayAdapter({
    experimental_ioTiming: true,
    axiosInstance: axios.create(),
    recordingsDir,
  });

  expect(fs.existsSync(recordingsDir)).toBeTruthy();
  fs.rmdirSync(recordingsDir);
});

test("creates a recording with default filename", async () => {
  const axiosInstance = axios.create();
  useAxiosRecordReplayAdapter({ axiosInstance });

  const { data } = await axiosInstance.get("https://reqres.in/api/users/7");

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
  const axiosInstance = axios.create();

  useAxiosRecordReplayAdapter({
    experimental_ioTiming: true,
    axiosInstance,
    buildFilenamePrefix(request) {
      return request.path.replace(/\//g, "-").slice(1);
    },
  });

  await axiosInstance.get("https://reqres.in/api/users/7");

  const [recording] = fs.readdirSync("./recordings");
  expect(recording).toMatchInlineSnapshot(
    `"api-users-7_1ab499d565acf87f67ac738631d42d07.json"`
  );
});

test("returns a cached response when a recording exists", async () => {
  const axiosInstance = axios.create({
    baseURL: "https://reqres.in",
  });

  const spy = jest.spyOn(axiosInstance.defaults, "adapter");

  useAxiosRecordReplayAdapter({ axiosInstance });
  await axiosInstance.get("/api/users/7");
  await axiosInstance.get("/api/users/7");
  await axiosInstance.get("/api/users/7");

  expect(spy).toHaveBeenCalledTimes(1);
});

test("records a custom request", async () => {
  const axiosInstance = axios.create();

  useAxiosRecordReplayAdapter({
    axiosInstance,
    buildRequest(requestConfig) {
      return { path: new URL(requestConfig.url!).pathname };
    },
  });

  await axiosInstance.get("https://reqres.in/api/users/7");
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
  const axiosInstance = axios.create();

  useAxiosRecordReplayAdapter({
    axiosInstance,
    buildResponse() {
      return { data: Buffer.from(new ArrayBuffer(128)) };
    },
  });

  await axiosInstance.get("https://reqres.in/api/users/7");
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
  const defaultAdapter = axios.defaults.adapter;

  const restoreDefaultAdapater = useAxiosRecordReplayAdapter();
  expect(axios.defaults.adapter).not.toBe(defaultAdapter);

  restoreDefaultAdapater();
  expect(axios.defaults.adapter).toBe(defaultAdapter);
});
