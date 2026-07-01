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

const SEED = "test test test test test test test test test test test junk";
const RECIPIENT = "0x0000000000000000000000000000000000000001";
const TOKEN = "0x0000000000000000000000000000000000000002";
const ZERO = "0x0000000000000000000000000000000000000000";

let mockHinkal;
const prepareEthersHinkal = jest.fn(async () => mockHinkal);

jest.unstable_mockModule(
  "@hinkal/common/providers/prepareEthersHinkal",
  () => ({
    prepareEthersHinkal,
  }),
);

const { default: WalletAccountEvmHinkal } =
  await import("../src/wallet-account-evm-hinkal.js");
const { ProviderNotConnectedError, InvalidRecipientError, InvalidAmountError } =
  await import("../src/errors.js");

/** @param {boolean} connected - Whether the account has a provider. */
function makeAccount(connected = true) {
  const account = new WalletAccountEvmHinkal(SEED, "0'/0/0");
  const provider = { getNetwork: jest.fn(async () => ({ chainId: 10n })) };
  account._provider = connected ? provider : undefined;
  account._account = {
    address: account._account.address,
    provider: connected ? provider : null,
  };
  return account;
}

beforeEach(() => {
  prepareEthersHinkal.mockClear();
  mockHinkal = {
    depositAndWithdraw: jest.fn(async () => ({
      depositTxHash: "0xdep",
      scheduleId: "s1",
    })),
    withdrawStuckUtxos: jest.fn(async () => ["0xh1", "0xh2"]),
    getStuckShieldedBalances: jest.fn(async () => [
      { erc20Address: TOKEN, balance: 5n },
      { erc20Address: ZERO, balance: 7n },
    ]),
    checkSendTransactionStatus: jest.fn(async () => ({ scheduleId: "s1" })),
  };
});

describe("privateSend", () => {
  test("forwards to the SDK (parsing amount) and returns its result", async () => {
    const result = await makeAccount().privateSend({
      token: TOKEN,
      recipient: RECIPIENT,
      amount: "250",
    });
    expect(result).toEqual({ depositTxHash: "0xdep", scheduleId: "s1" });
    expect(mockHinkal.depositAndWithdraw).toHaveBeenCalledWith(
      10,
      TOKEN,
      [250n],
      [RECIPIENT],
    );
  });

  test("rejects a bad recipient", async () => {
    await expect(
      makeAccount().privateSend({
        token: TOKEN,
        recipient: "nope",
        amount: 1n,
      }),
    ).rejects.toBeInstanceOf(InvalidRecipientError);
  });

  test("rejects a non-positive amount", async () => {
    await expect(
      makeAccount().privateSend({
        token: TOKEN,
        recipient: RECIPIENT,
        amount: 0n,
      }),
    ).rejects.toBeInstanceOf(InvalidAmountError);
  });
});

test("getSendStatus delegates to the SDK", async () => {
  const status = await makeAccount().getSendStatus("s1");
  expect(status.scheduleId).toBe("s1");
  expect(mockHinkal.checkSendTransactionStatus).toHaveBeenCalledWith("s1");
});

test("withdrawStuckUtxos returns the hashes, withdrawing to the account address", async () => {
  const account = makeAccount();
  const { hashes } = await account.withdrawStuckUtxos({ token: TOKEN });
  expect(hashes).toEqual(["0xh1", "0xh2"]);
  expect(mockHinkal.withdrawStuckUtxos).toHaveBeenCalledWith(
    10,
    TOKEN,
    await account.getAddress(),
  );
});

test("stuckUtxoBalances flattens the SDK balances to { token, balance }", async () => {
  const balances = await makeAccount().stuckUtxoBalances();
  expect(balances).toEqual([
    { token: TOKEN, balance: 5n },
    { token: ZERO, balance: 7n },
  ]);
});

test("operations reject when the wallet is not connected", async () => {
  await expect(makeAccount(false).stuckUtxoBalances()).rejects.toBeInstanceOf(
    ProviderNotConnectedError,
  );
});

describe("session caching", () => {
  test("builds the session once, then reuses it", async () => {
    const account = makeAccount();
    await account.stuckUtxoBalances();
    await account.getSendStatus("s1");
    expect(prepareEthersHinkal).toHaveBeenCalledTimes(1);
  });

  test("retries after a build failure", async () => {
    const account = makeAccount();
    prepareEthersHinkal.mockRejectedValueOnce(new Error("init failed"));
    await expect(account.stuckUtxoBalances()).rejects.toThrow("init failed");
    await account.stuckUtxoBalances();
    expect(prepareEthersHinkal).toHaveBeenCalledTimes(2);
  });
});
