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

import { InvalidSignerError } from "@tetherto/wdk-wallet";

import WalletManagerEvmHinkal from "../src/wallet-manager-evm-hinkal.js";
import WalletAccountEvmHinkal from "../src/wallet-account-evm-hinkal.js";

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

  test("rejects a pre-built signer at construction", () => {
    const signer = { getAddress: async () => "0x0", signTransaction: async () => "0x" };
    expect(() => new WalletManagerEvmHinkal(signer)).toThrow(InvalidSignerError);
  });

  test("rejects a signer name passed to getAccount", async () => {
    const wallet = new WalletManagerEvmHinkal(TEST_SEED);
    await expect(wallet.getAccount("hw")).rejects.toBeInstanceOf(InvalidSignerError);
    await expect(
      wallet.getAccount(0, { signerName: "hw" }),
    ).rejects.toBeInstanceOf(InvalidSignerError);
  });

  test("rejects a signer name passed to getAccountByPath", async () => {
    const wallet = new WalletManagerEvmHinkal(TEST_SEED);
    await expect(
      wallet.getAccountByPath("0'/0/0", { signerName: "hw" }),
    ).rejects.toBeInstanceOf(InvalidSignerError);
  });

  test("dispose clears the account's Hinkal signer and session", async () => {
    const wallet = new WalletManagerEvmHinkal(TEST_SEED);
    const account = await wallet.getAccountByPath("0'/0/0");
    expect(account._hinkalSigner).toBeDefined();

    account.dispose();

    expect(account._hinkalSigner).toBeUndefined();
    expect(account._hinkalSession).toBeUndefined();
  });
});