# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.2.0](https://github.com/mapequation/network-navigator/compare/v1.1.2...v1.2.0) (2021-05-10)


### Features

* Expose node limit to user ([e06d086](https://github.com/mapequation/network-navigator/commit/e06d086a62b92346f9778627f6333649744287f7))


### Bug Fixes

* Add fetch polyfill ([fe93720](https://github.com/mapequation/network-navigator/commit/fe937209bdf8263225ab6bdb3ef0fd6a7cc81b8d)), closes [#NETWORK-NAVIGATOR-15](https://github.com/mapequation/network-navigator/issues/NETWORK-NAVIGATOR-15)
* Support new multilayer input ([c073d7c](https://github.com/mapequation/network-navigator/commit/c073d7ca9c937e40abf6969930926b3cc1d2d1f2))

### [1.1.2](https://github.com/mapequation/network-navigator/compare/v1.1.1...v1.1.2) (2020-04-06)


### Bug Fixes

* Export network causes crash due to missing root enterflow ([7b077b0](https://github.com/mapequation/network-navigator/commit/7b077b0d37860268b4131cce8655434f884f1b69))

### [1.1.1](https://github.com/mapequation/network-navigator/compare/v1.1.0...v1.1.1) (2020-03-04)


### Bug Fixes

* Support new ftree format in Infomap v1.0 ([#10](https://github.com/mapequation/network-navigator/issues/10)) ([87d8716](https://github.com/mapequation/network-navigator/commit/87d8716c19174f73bb69fec1349b55d2e4c28a4d))

## [1.1.0](https://github.com/mapequation/network-navigator/compare/v1.0.0...v1.1.0) (2020-02-05)


### Features

* Display version information on landing page ([a09735d](https://github.com/mapequation/network-navigator/commit/a09735dbf671f6004b6b9c6143a7677703121087))


### Bug Fixes

* Alert user if canvas.toBlob is not supported ([5730a6c](https://github.com/mapequation/network-navigator/commit/5730a6c41157af23a45f6aa9ddec529985646a31))
* Make sure flow and exitFlow are numbers before calling toPrecision ([dee3e00](https://github.com/mapequation/network-navigator/commit/dee3e00d59e1542391aa66889e6d690e28455285))

## 1.0.0 (2020-02-05)


### Features

* Display number of visible leaf nodes ([f33fbe9](https://github.com/mapequation/network-navigator/commit/f33fbe986036b653ccdd7f00e027a0dd6f0d524f))
* Occurrences csv download now contains node names instead of ids ([c724a41](https://github.com/mapequation/network-navigator/commit/c724a41cc4a3035a720b269bf4cb80d41ac3e396))


### Bug Fixes

* Accept numbers as node names when reading occurrences lists ([a286dac](https://github.com/mapequation/network-navigator/commit/a286dac97dab0c240e6daec1bda47533fbc08bda))
* Add core-js for supporing older browsers ([387c198](https://github.com/mapequation/network-navigator/commit/387c1982d5d5b8ba75e9653fae266b246f571ef5))
* Check if 'file' is defined before accessing name property ([d2f35ac](https://github.com/mapequation/network-navigator/commit/d2f35ac87d10594f8e95fcf5d705ef623828cfbf))
* Don't let Sentry capture parsing exceptions ([3519eda](https://github.com/mapequation/network-navigator/commit/3519eda7a9e19b445f7a0957bb5585716b0ec8a6))
* Don't unregister serviceworker as this fails on Firefox ([8beea62](https://github.com/mapequation/network-navigator/commit/8beea62ae04980ab1a93df2bea7105c0021f3f96))
* Return 0 if we calculate max flow/node count on an empty array ([c07aa4c](https://github.com/mapequation/network-navigator/commit/c07aa4cb87740ddee175d1895d2a8a45425b3527))
* Silence eslint warning ([b3aa93a](https://github.com/mapequation/network-navigator/commit/b3aa93ac767b6e39189df93faccfcbb3c4bfa70c))
