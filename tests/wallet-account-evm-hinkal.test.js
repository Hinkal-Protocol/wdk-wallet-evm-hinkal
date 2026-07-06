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

import WalletManagerEvmHinkal from "../src/wallet-manager-evm-hinkal.js";
import WalletAccountEvmHinkal from "../src/wallet-account-evm-hinkal.js";
import {
  ProviderNotConnectedError,
  InvalidRecipientError,
  InvalidAmountError,
} from "../src/errors.js";

const { SEED, RPC_URL, TOKEN, RECIPIENT, AMOUNT, CHAIN_ID } = process.env;

const RUN_INTEGRATION = Boolean(
  SEED && RPC_URL && TOKEN && RECIPIENT && AMOUNT && CHAIN_ID,
);
const describeIntegration = RUN_INTEGRATION ? describe : describe.skip;

if (!RUN_INTEGRATION) {
  console.warn(
    "Skipping integration tests: set SEED, RPC_URL, TOKEN, CHAIN_ID, RECIPIENT and AMOUNT in .env to run them.",
  );
}

/** @returns {Promise<WalletAccountEvmHinkal>} A provider-connected account. */
async function connectedAccount() {
  const wallet = new WalletManagerEvmHinkal(SEED, {
    provider: RPC_URL,
    chainId: Number(CHAIN_ID),
  });
  return wallet.getAccountByPath("0'/0/0");
}

describeIntegration(`WalletAccountEvmHinkal (chain ${CHAIN_ID})`, () => {
  /** @type {WalletAccountEvmHinkal} */
  let account;

  beforeAll(async () => {
    account = await connectedAccount();
    console.log("address", account.address);
  });

  afterAll(async () => {
    try {
      const hinkal = await account?._hinkalSession;
      await hinkal?.destroy?.();
    } catch {
      // best-effort teardown; ignore
    }
    account?._provider?.destroy?.();
  });

  describe("privateSend input validation", () => {
    // Validation runs before any provider/SDK access, so no connection needed.
    const offline = new WalletAccountEvmHinkal(SEED, "0'/0/0");

    test("rejects a bad recipient", async () => {
      await expect(
        offline.privateSend({ token: TOKEN, recipient: "nope", amount: 1n }),
      ).rejects.toBeInstanceOf(InvalidRecipientError);
    });

    test("rejects a non-positive amount", async () => {
      await expect(
        offline.privateSend({ token: TOKEN, recipient: RECIPIENT, amount: 0n }),
      ).rejects.toBeInstanceOf(InvalidAmountError);
    });

    test("rejects a malformed amount", async () => {
      await expect(
        offline.privateSend({
          token: TOKEN,
          recipient: RECIPIENT,
          amount: "not-a-number",
        }),
      ).rejects.toBeInstanceOf(InvalidAmountError);
    });
  });

  test("operations reject when the wallet is not connected to a provider", async () => {
    const disconnected = new WalletAccountEvmHinkal(SEED, "0'/0/0");
    await expect(disconnected.stuckUtxoBalances()).rejects.toBeInstanceOf(
      ProviderNotConnectedError,
    );
  });

  test("derives a valid EVM address", async () => {
    const address = await account.getAddress();
    expect(address).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });

  test("reads stuck shielded balances", async () => {
    const balances = await account.stuckUtxoBalances();
    expect(Array.isArray(balances)).toBe(true);
    for (const b of balances) {
      expect(typeof b.token).toBe("string");
      expect(typeof b.balance).toBe("bigint");
    }
  }, 120_000);

  test("schedules a private send and tracks its status", async () => {
    const { depositTxHash, scheduleId } = await account.privateSend({
      token: TOKEN,
      recipient: RECIPIENT,
      amount: BigInt(AMOUNT),
    });
    expect(depositTxHash).toMatch(/^0x[0-9a-fA-F]+$/);
    expect(typeof scheduleId).toBe("string");

    const status = await account.getSendStatus(scheduleId);
    expect(status).toBeDefined();
  }, 300_000);

  test("recovers stuck UTXOs when any are present", async () => {
    const balances = await account.stuckUtxoBalances();
    if (balances.length === 0) return; // nothing stranded; skip the on-chain withdrawal
    const { hashes } = await account.withdrawStuckUtxos({
      token: balances[0].token,
    });
    expect(Array.isArray(hashes)).toBe(true);
  }, 300_000);
});
