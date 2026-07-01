// Copyright 2026 Hinkal Protocol
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

"use strict";

// The Hinkal SDK is not plain-ESM loadable in Node: its dependency graph mixes
// CJS and ESM (@solana/web3.js -> rpc-websockets -> uuid, circomlibjs, ...).
// Running under a CJS test environment and transpiling node_modules with
// babel-jest lets the real SDK load. libsodium-wrappers and google-protobuf are
// UMD bundles that rely on a non-strict `this`/`self`; transpiling them breaks
// their environment detection, so they are left untouched.
module.exports = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/tests/setup.env.cjs"],
  transform: { "^.+\\.(js|mjs|cjs)$": "babel-jest" },
  transformIgnorePatterns: ["/node_modules/(libsodium|google-protobuf)"],
  moduleNameMapper: { "^ethers$": require.resolve("ethers") },
};
