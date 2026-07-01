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

import { jest } from "@jest/globals";

// The account module imports the Hinkal session builder at load time, which
// pulls in heavy dependencies. Mock it so the manager tests load
// without touching the real SDK.
jest.unstable_mockModule(
  "@hinkal/common/providers/prepareEthersHinkal",
  () => ({ prepareEthersHinkal: jest.fn() }),
);

const { default: WalletManagerEvmHinkal } =
  await import("../src/wallet-manager-evm-hinkal.js");
const { default: WalletAccountEvmHinkal } =
  await import("../src/wallet-account-evm-hinkal.js");

const TEST_SEED = "test test test test test test test test test test test junk";

describe("WalletManagerEvmHinkal", () => {
  test("getAccountByPath returns a Hinkal-enabled account", async () => {
    const wallet = new WalletManagerEvmHinkal(TEST_SEED);
    const account = await wallet.getAccountByPath("0'/0/0");
    expect(account).toBeInstanceOf(WalletAccountEvmHinkal);
  });

  test("getAccount delegates to the overridden getAccountByPath", async () => {
    const wallet = new WalletManagerEvmHinkal(TEST_SEED);
    const account = await wallet.getAccount(0);
    expect(account).toBeInstanceOf(WalletAccountEvmHinkal);
  });

  test("caches accounts per path", async () => {
    const wallet = new WalletManagerEvmHinkal(TEST_SEED);
    const a = await wallet.getAccountByPath("0'/0/0");
    const b = await wallet.getAccountByPath("0'/0/0");
    expect(a).toBe(b);
  });

  test("different paths yield different accounts", async () => {
    const wallet = new WalletManagerEvmHinkal(TEST_SEED);
    const a = await wallet.getAccountByPath("0'/0/0");
    const b = await wallet.getAccountByPath("0'/0/1");
    expect(a).not.toBe(b);
  });
});
