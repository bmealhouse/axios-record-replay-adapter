# `axios-record-replay-adapter` 🎥 🎬 🍿

[![npm version](https://img.shields.io/npm/v/axios-record-replay-adapter.svg)](https://npmjs.org/package/axios-record-replay-adapter)
[![npm downloads](https://img.shields.io/npm/dm/axios-record-replay-adapter.svg)](https://npmjs.org/package/axios-record-replay-adapter)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![build status](https://travis-ci.com/bmealhouse/axios-record-replay-adapter.svg?branch=master)](https://travis-ci.com/bmealhouse/axios-record-replay-adapter)

> Sit back, relax, and automatically record/replay your HTTP requests

## Table of contents

- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Installation

### yarn

```sh
yarn add axios
yarn add axios-record-replay-adapter --dev
```

### npm

```sh
npm i axios --save
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

## Contributing

1. [Fork](https://help.github.com/en/articles/fork-a-repo) this repository to your own GitHub account and then [clone](https://help.github.com/en/articles/cloning-a-repository) it to your local device
1. Install the dependecies using `yarn`
1. Link the package to the global module directory: `yarn link`
1. Run `yarn test --watch` and start making your changes
1. You can use `yarn link axios-record-replay-adapter` to test your changes in a local project
1. Ensure any changes are documented in `CHANGELOG.md`

## License

MIT © Brent Mealhouse
