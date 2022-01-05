# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.7.8](https://github.com/MapColonies/sync-worker/compare/v1.7.7...v1.7.8) (2022-01-05)

### [1.7.7](https://github.com/MapColonies/sync-worker/compare/v1.7.6...v1.7.7) (2022-01-03)

### [1.7.6](https://github.com/MapColonies/sync-worker/compare/v1.7.5...v1.7.6) (2022-01-03)

### [1.7.5](https://github.com/MapColonies/sync-worker/compare/v1.7.4...v1.7.5) (2022-01-02)

### [1.7.4](https://github.com/MapColonies/sync-worker/compare/v1.7.3...v1.7.4) (2021-12-30)


### Bug Fixes

* s3 Win compatibility ([#20](https://github.com/MapColonies/sync-worker/issues/20)) ([e421dd5](https://github.com/MapColonies/sync-worker/commit/e421dd57f58ac3b5fde3c9f6dd0e58eff9b72870))

### [1.7.3](https://github.com/MapColonies/sync-worker/compare/v1.7.2...v1.7.3) (2021-12-29)


### Bug Fixes

* Helm fixes ([#18](https://github.com/MapColonies/sync-worker/issues/18)) ([5f43322](https://github.com/MapColonies/sync-worker/commit/5f433229762e869b7624857816ba23fc68f5364b))

### [1.7.2](https://github.com/MapColonies/sync-worker/compare/v1.7.0...v1.7.2) (2021-12-19)


### Bug Fixes

* fix integration bugs (crypto and layer-spec) ([#16](https://github.com/MapColonies/sync-worker/issues/16)) ([18ba9d1](https://github.com/MapColonies/sync-worker/commit/18ba9d1e036661dcf824fb23879e8207dfb98e61))
* providers injection ([c01d24c](https://github.com/MapColonies/sync-worker/commit/c01d24cf1f752a0facfdefc229d15014d75780fb))

### [1.7.1](https://github.com/MapColonies/sync-worker/compare/v1.7.0...v1.7.1) (2021-12-14)


### Bug Fixes

* providers injection ([c01d24c](https://github.com/MapColonies/sync-worker/commit/c01d24cf1f752a0facfdefc229d15014d75780fb))

## [1.7.0](https://github.com/MapColonies/sync-worker/compare/v1.6.0...v1.7.0) (2021-12-12)


### Features

* send target to layer spec route ([#13](https://github.com/MapColonies/sync-worker/issues/13)) ([77a9f48](https://github.com/MapColonies/sync-worker/commit/77a9f48838df71dbafb8631f8800482f8baf908c))


### Bug Fixes

* Helm fixes ([#12](https://github.com/MapColonies/sync-worker/issues/12)) ([3fe9923](https://github.com/MapColonies/sync-worker/commit/3fe99230f3726edfc25966f785b61eab308436ba))

## [1.6.0](https://github.com/MapColonies/sync-worker/compare/v1.5.0...v1.6.0) (2021-12-01)


### Features

* support basic authentication for gateway ([#11](https://github.com/MapColonies/sync-worker/issues/11)) ([24b1e5e](https://github.com/MapColonies/sync-worker/commit/24b1e5e5e7d82057a3acce154bfcab58d0e54576))

## [1.5.0](https://github.com/MapColonies/sync-worker/compare/v1.4.0...v1.5.0) (2021-11-28)


### Features

* added s3 and streams support ([#9](https://github.com/MapColonies/sync-worker/issues/9)) ([79d5b98](https://github.com/MapColonies/sync-worker/commit/79d5b98bd1cad956641b238df8e4ef4287bb7dce))

## [1.4.0](https://github.com/MapColonies/sync-worker/compare/v1.3.0...v1.4.0) (2021-11-22)


### Features

* Support toc different task type's ([#7](https://github.com/MapColonies/sync-worker/issues/7)) ([95286a1](https://github.com/MapColonies/sync-worker/commit/95286a18e171ead549d8813322b61079a3e66cde))


### Bug Fixes

* hot fix helm chart ([#8](https://github.com/MapColonies/sync-worker/issues/8)) ([1c1403f](https://github.com/MapColonies/sync-worker/commit/1c1403fa03c638c3901aa85ca88c7ea36e999257))

## [1.3.0](https://github.com/MapColonies/sync-worker/compare/v1.2.0...v1.3.0) (2021-11-16)


### Features

* support sending TOC to GW ([#6](https://github.com/MapColonies/sync-worker/issues/6)) ([80be62a](https://github.com/MapColonies/sync-worker/commit/80be62ac96d7f9f09aa07ec322de5cb986bfb19a))


### Bug Fixes

* fix NiFi route ([#5](https://github.com/MapColonies/sync-worker/issues/5)) ([58a6865](https://github.com/MapColonies/sync-worker/commit/58a68652127db2b813e7264f2406a7d9c9609f67))
* prevent duplicate tiles on layer-spec when in retry ([#4](https://github.com/MapColonies/sync-worker/issues/4)) ([25992d5](https://github.com/MapColonies/sync-worker/commit/25992d50df5719f7fd2dea6a8c09bf832b7edb24))

## [1.2.0](https://github.com/MapColonies/sync-worker/compare/v1.1.0...v1.2.0) (2021-11-02)


### Features

* support relative layer path ([#3](https://github.com/MapColonies/sync-worker/issues/3)) ([95eee05](https://github.com/MapColonies/sync-worker/commit/95eee052d5cc744269a60bc493902d445b86b2f7))


### Bug Fixes

* added comment ([7f92434](https://github.com/MapColonies/sync-worker/commit/7f92434d22a99e1270f2fe0b657d3f421ca89fe8))
* lint ignore on azure-pipelines ([4226a2b](https://github.com/MapColonies/sync-worker/commit/4226a2b0406c02bab159cbea4f14abcbda52c064))

## 1.1.0 (2021-10-06)


### Features

* added signature base logic ([91a5cd9](https://github.com/MapColonies/sync-worker/commit/91a5cd90af391edf5188c7f884a96401c8ecbdff))


### Bug Fixes

* fixed comments ([b5685ce](https://github.com/MapColonies/sync-worker/commit/b5685ce0d2711576231ec2bd5830099b26bb70f3))
* fixed crypto configs ([4cc7022](https://github.com/MapColonies/sync-worker/commit/4cc70221bb727341fbf75556f7c7197ca2e64f1d))
* fixed default config values ([318e158](https://github.com/MapColonies/sync-worker/commit/318e158a9991577dbb33d3beec8ce2683464fd0f))
* fixed helm flavor ([3640c71](https://github.com/MapColonies/sync-worker/commit/3640c71f7e66ed01321530fb67215f3e2a11abe1))
* fixed test ([577b8d3](https://github.com/MapColonies/sync-worker/commit/577b8d3ed473cefb3406ac9d4264c6c543550118))
* fixed test ([21d03cb](https://github.com/MapColonies/sync-worker/commit/21d03cb7eb929d33268726b52b3da71145152f6e))
* fixed typo ([45e348d](https://github.com/MapColonies/sync-worker/commit/45e348d3e600a44e9e48a05738553ed9849c0a80))
* removed logs and fixed lint errors ([50ade55](https://github.com/MapColonies/sync-worker/commit/50ade558d9809d0ffc1839fc5daf9a5b0753205d))
* removed unnecessary envs ([2816708](https://github.com/MapColonies/sync-worker/commit/2816708b28b4ae3143b7efbc5fc5781c0b81d225))
