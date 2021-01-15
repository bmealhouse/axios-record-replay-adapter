import crypto from "crypto";
import fs from "fs";
import path from "path";
import { performance, PerformanceObserver } from "perf_hooks";
import { promisify } from "util";
import axios, {
  AxiosAdapter,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";

let totalDuration = 0;
let totalRequests = 0;

const performanceObserver = new PerformanceObserver(items => {
  items.getEntries().forEach(entry => {
    totalDuration += entry.duration;
  });
  console.log(`⏱  Total I/O time: ${totalDuration}ms`);
});

let performancObserverEnabled = false;
const enablePerformanceObserver = () => {
  if (!performancObserverEnabled) {
    performanceObserver.observe({
      entryTypes: ["measure"],
      buffered: true,
    });
    performancObserverEnabled = true;
  }
};

process.on("beforeExit", () => {
  if (performancObserverEnabled) {
    console.log(`⏱  Total I/O time: ${totalDuration}ms (onBeforeExit)`);
  }
});

process.on("exit", () => {
  if (performancObserverEnabled) {
    console.log(`⏱  Total I/O time: ${totalDuration}ms (onExit)`);
  }
});

let defaultAdapter: AxiosAdapter | undefined;
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

interface AxiosRecordReplayAdapterOptions {
  debug?: boolean;
  experimental_ioTiming?: boolean;
  axiosInstance?: AxiosInstance;
  recordingsDir?: string;
  buildRequest?(config: AxiosRequestConfig): any;
  buildResponse?(response: AxiosResponse): any;
  buildFilenamePrefix?(request: any): string;
}

function defaultBuildRequest(requestConfig: AxiosRequestConfig): any {
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const baseURL = requestConfig.baseURL || "";

  return {
    method: requestConfig.method,
    path: new URL(baseURL + requestConfig.url!).pathname,
    data: requestConfig.data,
  };
}

function defaultBuildResponse(response: AxiosResponse): any {
  return {
    status: response.status,
    statusText: response.statusText,
    data: response.data,
  };
}

export default (
  options: AxiosRecordReplayAdapterOptions = {}
): (() => void) => {
  const {
    debug = false,
    experimental_ioTiming = false,
    axiosInstance = axios,
    recordingsDir = "./recordings",
    buildRequest = defaultBuildRequest,
    buildResponse = defaultBuildResponse,
    buildFilenamePrefix,
  } = options;

  if (debug && experimental_ioTiming) {
    enablePerformanceObserver();
  }

  log("🍿  Initialized axios-record-replay-adapter");

  try {
    const absolutePath = path.resolve(process.cwd(), recordingsDir);
    fs.mkdirSync(absolutePath);
    log(`✨  Created recordings directory (${absolutePath})`);
  } catch {}

  defaultAdapter = axiosInstance.defaults.adapter;
  axiosInstance.defaults.adapter = axiosRecordReplayAdapter;

  return () => {
    axiosInstance.defaults.adapter = defaultAdapter;
  };

  async function axiosRecordReplayAdapter(
    config: AxiosRequestConfig
  ): Promise<any> {
    totalRequests += 1;
    const performanceId = `request${totalRequests}`;
    performance.mark(`${performanceId}-read-start`);

    const request = buildRequest(config);
    const filepath = generateFilepath(request);

    try {
      const { response } = JSON.parse(await readFile(filepath, "utf8"));
      const result = {
        config,
        ...response,
        data: JSON.stringify(response.data),
      };

      performance.mark(`${performanceId}-read-end`);
      performance.measure(
        performanceId,
        `${performanceId}-read-start`,
        `${performanceId}-read-end`
      );

      return result;
    } catch (error) {
      // If we make it to this point in CI, our recordings are out of date.
      // Notify the developer to update recordings.
      if (
        process.env.CI &&
        !(
          process.env.npm_package_repository_url &&
          process.env.npm_package_repository_url.includes(
            "bmealhouse/axios-record-replay-adapter"
          )
        )
      ) {
        console.log(
          "Recording not found. Re-run tests to create missing recordings.\n",
          { filepath, request }
        );
        performance.clearMarks();
        throw error;
      }
    }

    performance.mark(`${performanceId}-read-end`);
    performance.measure(
      performanceId,
      `${performanceId}-read-start`,
      `${performanceId}-read-end`
    );

    const response = await defaultAdapter!(config);

    performance.mark(`${performanceId}-write-start`);
    log(`🎥  Created recording (${path.parse(filepath).base})`);
    await writeFile(filepath, createFileContents(request, response));
    performance.mark(`${performanceId}-write-end`);
    performance.measure(
      performanceId,
      `${performanceId}-write-start`,
      `${performanceId}-write-end`
    );

    return response;
  }

  function generateFilepath(request: any): string {
    const filepath = path.resolve(process.cwd(), recordingsDir);

    const hash = crypto.createHash("md5");
    hash.update(JSON.stringify(request));
    const filename = hash.digest("hex");

    return buildFilenamePrefix
      ? `${filepath}/${buildFilenamePrefix(request)}_${filename}.json`
      : `${filepath}/${filename}.json`;
  }

  function createFileContents(
    request: any,
    axiosResponse: AxiosResponse
  ): string {
    const response = buildResponse(axiosResponse);
    return JSON.stringify(
      {
        request: {
          ...request,
          data: safeJsonParse(request.data),
        },
        response: {
          ...response,
          data: safeJsonParse(response.data),
        },
      },
      null,
      2
    );
  }

  function log(message: string): void {
    if (debug) {
      console.log(message);
    }
  }
};

function safeJsonParse(data: string): any {
  try {
    return JSON.parse(data);
  } catch {
    return Buffer.isBuffer(data) ? "[Buffer]" : data;
  }
}
