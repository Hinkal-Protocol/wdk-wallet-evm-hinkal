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

'use strict'

import WalletManagerEvm from '@tetherto/wdk-wallet-evm'

import WalletAccountEvmHinkal from './wallet-account-evm-hinkal.js'

/**
 * A wallet manager for EVM blockchains whose accounts support Hinkal private transfers.
 */
export default class WalletManagerEvmHinkal extends WalletManagerEvm {
  /**
   * Creates a new Hinkal-enabled EVM wallet manager.
   *
   * @param {string | Uint8Array} seedOrSigner - A BIP-39 seed phrase, seed bytes, or a root
   *   signer. Only seeds/bytes are usable with Hinkal accounts — see {@link getAccountByPath}.
   * @param {import('@tetherto/wdk-wallet-evm').EvmWalletConfig} [config] - The configuration object.
   */
  constructor (seedOrSigner, config = {}) {
    super(seedOrSigner, config)

    if (
      typeof seedOrSigner === 'string' ||
      seedOrSigner instanceof Uint8Array
    ) {
      this._hinkalSeed = seedOrSigner
    }
  }

  /**
   * Returns the Hinkal-enabled wallet account at a specific BIP-44 derivation path.
   *
   * @param {string} path - The derivation path (e.g. "0'/0/0").
   * @returns {Promise<WalletAccountEvmHinkal>} The account.
   * @throws {Error} If the manager was constructed with a pre-built signer instead of a seed.
   */
  async getAccountByPath (path) {
    if (!this._hinkalSeed) {
      throw new Error(
        'WalletManagerEvmHinkal requires a BIP-39 seed (not a pre-built signer) to derive Hinkal-enabled accounts.'
      )
    }
    if (!this._accounts[path]) {
      this._accounts[path] = new WalletAccountEvmHinkal(
        this._hinkalSeed,
        path,
        this._config
      )
    }

    return this._accounts[path]
  }
}
