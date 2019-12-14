# `axios-record-replay-adapter` 🎥 🎬 🍿

[![npm version](https://img.shields.io/npm/v/axios-record-replay-adapter.svg)](https://npmjs.org/package/axios-record-replay-adapter)
[![npm downloads](https://img.shields.io/npm/dm/axios-record-replay-adapter.svg)](https://npmjs.org/package/axios-record-replay-adapter)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![build status](https://travis-ci.com/bmealhouse/axios-record-replay-adapter.svg?branch=master)](https://travis-ci.com/bmealhouse/axios-record-replay-adapter)

> Sit back, relax, and enjoy automatic mocking for axios HTTP requests

## Table of contents

- [Installation](#installation)
- [Setup](#setup)
- [Usage](#usage)
- [Advanded usage](#advanced-usage)
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

## Setup

### Ignore recordings directory

When running tests in watch mode, the recordings directory must be ignored to prevent recording files from triggering tests to re-run.

#### Jest

```json
{
  "jest": {
    "watchPathIgnorePatterns": [
      "<rootDir>/recordings"
    ]
  }
}
```

## Usage

### With defaults

```js
useAxiosRecordReplayAdapter()
```

### With options

```js
const customAxiosIntance = axios.create()
useAxiosRecordReplayAdapter({
  axiosInstance: customAxiosInstance
  recordingsDir: './tests/recordings'
})
```

### Restore axios default adapter

`axios-record-replay-adpater` returns a function to restore the default `axios` adapter.

```js
const restoreDefaultAdapater = useAxiosRecordReplay()
restoreDefaultAdapater()
```

## Advanced usage

### With `buildRequest()`

```js
useAxiosRecordReplayAdapter({
  buildRequest(axiosRequestConfig) {
    return {
      path: new URL(axiosRequestConfig.url).pathname
    }
  }
})
```

### With `buildResponse()`

```js
useAxiosRecordReplayAdapter({
  buildResponse(axiosResponse) {
    return {
      data: axiosResponse.data
    }
  }
})
```

### With `buildFilenamePrefix()`

> **NOTE**: The result of `buildRequest()` gets passed to `buildFilenamePrefix(request)`

```js
useAxiosRecordReplayAdapter({
  buildFilenamePrefix(requestFromBuildRequest) {
    return request.path.replace(/\//g, '-').slice(1)
  }
})
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
