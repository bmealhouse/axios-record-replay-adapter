# Axios Record Replay Adapter 🎥 🎬 🍿

[![npm version](https://img.shields.io/npm/v/axios-record-replay-adapter.svg)](https://npmjs.org/package/axios-record-replay-adapter)
[![npm downloads](https://img.shields.io/npm/dm/axios-record-replay-adapter.svg)](https://npmjs.org/package/axios-record-replay-adapter)
[![build status](https://travis-ci.com/bmealhouse/axios-record-replay-adapter.svg?branch=master)](https://travis-ci.com/bmealhouse/axios-record-replay-adapter)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

> Sit back, relax, and automatically record/replay your HTTP requests

## Installation

```sh
yarn add axios-record-replay-adapter --dev
npm i axios-record-replay-adapter --save-dev
```

## Usage

### Use `axios-record-replay-adapter` with default options

```js
useAxiosRecordReplayAdapter()
```

#### Default options

```js
{
  axiosInstance: axios,
  recordingsDir: './recordings',
  createRequest(axiosRequestConfig) {
    return {
      method: requestConfig.method,
      path: new URL(requestConfig.url).pathname,
      data: requestConfig.data,
    }
  },
  createResponse(axiosResponse) {
    return {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
    }
  }
}
```

### Use `axios-record-replay-adapter` with custom options

```js
const customAxiosInstance = axios.create()
useAxiosRecordReplayAdapter({
  axiosInstance: customAxiosInstance,
  recordingsDir: './tests/recordings',
})
```

### Ignore recordings directory in your test runner

> When running tests in watch mode, the recordings directory needs to be ignored to prevent recording files from triggering tests to re-run.

#### Jest example

```json
{
  "jest": {
    "watchPathIgnorePatterns": [
      "<rootDir>/recordings"
    ]
  }
}
```
