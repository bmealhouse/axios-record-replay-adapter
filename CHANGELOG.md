# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Experimental support for I/O timing
- Bundle with tsdx
- Upgrade dependencies

## 1.1.1 - 2020-03-28

### Fixed

- Display missing recording message in CI and rethrow error

### Changed

- Replace jsonplaceholder with reqres
- Minimal xo/prettier config
- Upgrade dependencies
- Misc updates

## [1.1.0] - 2020-01-24

### Added

- Package as web module

### Changed

- Upgrade dependencies

## [1.0.1] - 2020-01-08

### Fixed

- Support `baseURL` in `defaultBuildRequest`

## [1.0.0] - 2019-12-14

### Changed

- Recording filenames default to the hash only
- Returning `path` from `buildRequest()` is not required

### Added

- Add `buildFilenamePrefix()` to axios-record-replay-adapter options

## [0.2.1] - 2019-09-12

### Fixed

- Truncate the generated filepath to not exceed 255 characters

## [0.2.0] - 2019-08-08

### Added

- Add debug option
- Add additional test coverage

### Changed

- Don't throw CI error for this repository
- Renamed `createRequest()` to `buildRequest()`
- Renamed `createResponse()` to `buildResponse()`
- Cleanup docs

## [0.1.1] - 2019-08-01

### Added

- Add npm script to release axios-record-replay-adapter

### Changed

- Return a function to restore the default axios adapter

### Fixed

- Fix mistake in documentation

## [0.1.0] - 2019-08-01

- Initial release
