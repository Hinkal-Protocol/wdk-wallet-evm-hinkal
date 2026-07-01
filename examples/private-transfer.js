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

// Runnable example: private-send a token through Hinkal, then track and recover.
//
// Configure via environment variables, then run through a bundler-based runner
// (the Hinkal SDK is not plain Node.js ESM compatible). See `.env.example`.
//
//   SEED       BIP-39 mnemonic of the wallet
//   RPC_URL    EVM RPC endpoint (e.g. https://mainnet.optimism.io)
//   TOKEN      ERC-20 token address (e.g. USDC on Optimism)
//   RECIPIENT  Destination address for the private send
//   AMOUNT     Amount in the token's base units

"use strict";

import WalletManagerEvmHinkal, { HinkalError } from "@hinkal/wdk-wallet-evm";

const {
  SEED,
  RPC_URL,
  TOKEN,
  RECIPIENT,
  AMOUNT = "10000", // 0.01 USDC (6 decimals)
} = process.env;

async function main() {
  const wallet = new WalletManagerEvmHinkal(SEED, { provider: RPC_URL });
  const account = await wallet.getAccount(0);

  console.log("sender:", await account.getAddress());

  try {
    // 1. Schedule a private send.
    const { depositTxHash, scheduleId } = await account.privateSend({
      token: TOKEN,
      recipient: RECIPIENT,
      amount: BigInt(AMOUNT),
    });
    console.log("deposit tx:", depositTxHash);
    console.log("schedule id:", scheduleId);

    // 2. Check the scheduled withdrawal's status.
    const status = await account.getSendStatus(scheduleId);
    console.log("status:", status);
  } catch (err) {
    if (err instanceof HinkalError && err.isUserActionable) {
      console.error(`private send failed: ${err.message}`);
    } else {
      throw err;
    }
  }

  // 3. Inspect any stuck shielded balances, and recover them if present.
  const balances = await account.stuckUtxoBalances();
  console.log("stuck balances:", balances);

  if (balances.length > 0) {
    const { hashes } = await account.withdrawStuckUtxos({ token: TOKEN });
    console.log("recovered in txs:", hashes);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
