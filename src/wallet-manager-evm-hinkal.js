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

import WalletManagerEvm from "@tetherto/wdk-wallet-evm";
import { InvalidSignerError } from "@tetherto/wdk-wallet";

import WalletAccountEvmHinkal from "./wallet-account-evm-hinkal.js";

/**
 * A wallet manager for EVM blockchains whose accounts support Hinkal private transfers.
 */
export default class WalletManagerEvmHinkal extends WalletManagerEvm {
  /**
   * Creates a new Hinkal-enabled EVM wallet manager.
   *
   * This manager accepts only a seed because each account independently re-derives
   * an HD wallet from it to back Hinkal's SDK: WDK's own account signer wraps its
   * key behind `ISignerEvm` and does not expose a plain ethers `Signer`, which
   * Hinkal's SDK requires.
   *
   * @param {string | Uint8Array} seed - A BIP-39 seed phrase or seed bytes.
   * @param {import('@tetherto/wdk-wallet-evm').EvmWalletConfig} [config] - The configuration object.
   * @throws {InvalidSignerError} If given a signer instead of a seed.
   */
  constructor(seed, config = {}) {
    if (typeof seed !== "string" && !(seed instanceof Uint8Array)) {
      throw new InvalidSignerError(
        "WalletManagerEvmHinkal requires a BIP-39 seed phrase or seed bytes; pre-built signers are not supported because Hinkal derives its shielded keys from the seed.",
      );
    }

    super(seed, config);

    this._hinkalSeed = seed;
  }

  /**
   * Returns the Hinkal-enabled wallet account at an index.
   *
   * Overridden so that every account is a {@link WalletAccountEvmHinkal}. The base
   * implementation builds a plain account when given a signer name, which would
   * silently drop Hinkal support.
   *
   * @param {number} index - The account index.
   * @param {Object} [options] - Account options.
   * @returns {Promise<WalletAccountEvmHinkal>} The account.
   * @throws {InvalidSignerError} If a signer name is supplied.
   */
  async getAccount(index = 0, options = {}) {
    if (typeof index === "string") {
      throw new InvalidSignerError(
        `WalletManagerEvmHinkal has no named signers; got '${index}'. Hinkal accounts are always derived from the manager's seed.`,
      );
    }
    if (options.signerName !== undefined) {
      throw new InvalidSignerError(
        `WalletManagerEvmHinkal does not support the 'signerName' option (got '${options.signerName}'). Hinkal accounts are always derived from the manager's seed.`,
      );
    }

    return this.getAccountByPath(`${index}'/0/0`);
  }

  /**
   * Returns the Hinkal-enabled wallet account at a specific BIP-44 derivation path.
   *
   * @param {string} path - The derivation path (e.g. "0'/0/0").
   * @param {Object} [options] - Account options.
   * @returns {Promise<WalletAccountEvmHinkal>} The account.
   * @throws {InvalidSignerError} If a signer name is supplied.
   */
  async getAccountByPath(path, options = {}) {
    if (options.signerName !== undefined) {
      throw new InvalidSignerError(
        `WalletManagerEvmHinkal does not support the 'signerName' option (got '${options.signerName}'). Hinkal accounts are always derived from the manager's seed.`,
      );
    }

    if (!this._accounts[path]) {
      this._accounts[path] = new WalletAccountEvmHinkal(
        this._hinkalSeed,
        path,
        this._config,
      );
    }

    return this._accounts[path];
  }
}
