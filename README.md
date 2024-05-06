<div align="center">

# ts-declaration-location

[![npm version](https://img.shields.io/npm/v/ts-declaration-location.svg)](https://www.npmjs.com/package/ts-declaration-location)
[![CI](https://github.com/RebeccaStevens/ts-declaration-location/actions/workflows/release.yml/badge.svg)](https://github.com/RebeccaStevens/ts-declaration-location/actions/workflows/release.yml)
[![Coverage Status](https://codecov.io/gh/RebeccaStevens/ts-declaration-location/branch/main/graph/badge.svg?token=MVpR1oAbIT)](https://codecov.io/gh/RebeccaStevens/ts-declaration-location)\
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![GitHub Discussions](https://img.shields.io/github/discussions/RebeccaStevens/ts-declaration-location?style=flat-square)](https://github.com/RebeccaStevens/ts-declaration-location/discussions)
[![BSD 3 Clause license](https://img.shields.io/github/license/RebeccaStevens/ts-declaration-location.svg?style=flat-square)](https://opensource.org/licenses/BSD-3-Clause)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square)](https://commitizen.github.io/cz-cli/)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)

</div>

## Donate

[Any donations would be much appreciated](./DONATIONS.md). 😄

## Installation

```sh
# Install with npm
npm install -D ts-declaration-location

# Install with pnpm
pnpm add -D ts-declaration-location

# Install with yarn
yarn add -D ts-declaration-location
```

## Usage Example

<!-- eslint-disable import/order, import/no-extraneous-dependencies -->

```ts
import typeMatchesSpecifier from "ts-declaration-location";
import type ts from "typescript";

function isTypeFromSomePackage(program: ts.Program, type: ts.Type) {
  const specifier = {
    from: "package",
    package: "some-package"
  };

  return typeMatchesSpecifier(program, specifier, type);
}

function isTypeFromSomeFile(program: ts.Program, type: ts.Type) {
  const specifier = {
    from: "file",
    path: "src/**/some.ts"
  };

  return typeMatchesSpecifier(program, specifier, type);
}

function isTypeFromTSLib(program: ts.Program, type: ts.Type) {
  const specifier = {
    from: "lib",
  };

  return typeMatchesSpecifier(program, specifier, type);
}
```
