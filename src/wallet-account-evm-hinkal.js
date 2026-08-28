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

import * as bip39 from 'bip39'
import { HDNodeWallet, isAddress } from 'ethers'

import { WalletAccountEvm } from '@tetherto/wdk-wallet-evm'
import { prepareEthersHinkal } from '@hinkal/common/providers/prepareEthersHinkal'

import {
  ProviderNotConnectedError,
  InvalidRecipientError,
  InvalidAmountError
} from './errors.js'

const BIP_44_ETH_DERIVATION_PATH_PREFIX = "m/44'/60'"

/** @typedef {import('@tetherto/wdk-wallet-evm').EvmTransferOptions} EvmTransferOptions */
/** @typedef {import('./types.js').StuckUtxoBalance} StuckUtxoBalance */
/** @typedef {import('./types.js').ScheduledTransactionStatus} ScheduledTransactionStatus */

/**
 * An EVM wallet account with Hinkal private-transfer support.
 *
 * Extends the standard {@link WalletAccountEvm} with private sends and recovery of
 * stranded shielded UTXOs through the Hinkal protocol.
 */
export default class WalletAccountEvmHinkal extends WalletAccountEvm {
  /**
   * Creates a new Hinkal-enabled EVM wallet account from a BIP-39 seed.
   *
   * @param {string | Uint8Array} seed - The wallet's BIP-39 seed phrase or seed bytes.
   * @param {string} path - The BIP-44 derivation path (e.g. "0'/0/0").
   * @param {import('@tetherto/wdk-wallet-evm').EvmWalletConfig} [config] - The configuration object.
   */
  constructor (seed, path, config = {}) {
    super(seed, path, config)

    const seedBytes = typeof seed === 'string' ? bip39.mnemonicToSeedSync(seed) : seed
    this._hinkalSigner = HDNodeWallet.fromSeed(seedBytes).derivePath(
      `${BIP_44_ETH_DERIVATION_PATH_PREFIX}/${path}`
    )
    if (this._provider) {
      this._hinkalSigner = this._hinkalSigner.connect(this._provider)
    }
  }

  /**
   * Returns the account's Hinkal session, creating it on first use.
   *
   * @private
   * @returns {Promise<import('@hinkal/common').Hinkal<unknown>>}
   * @throws {ProviderNotConnectedError} If the wallet is not connected to a provider.
   */
  async _prepareHinkal () {
    if (!this._provider) {
      throw new ProviderNotConnectedError()
    }
    if (!this._hinkalSession) {
      this._hinkalSession = prepareEthersHinkal(this._hinkalSigner)
    }
    try {
      return await this._hinkalSession
    } catch (err) {
      this._hinkalSession = undefined
      throw err
    }
  }

  /**
   * Returns the chain id the account's provider is connected to.
   *
   * @private
   * @returns {Promise<number>}
   * @throws {ProviderNotConnectedError} If the wallet is not connected to a provider.
   */
  async _chainId () {
    if (!this._provider) {
      throw new ProviderNotConnectedError()
    }
    const { chainId } = await this._provider.getNetwork()
    return Number(chainId)
  }

  /**
   * Sends a token to another address privately through Hinkal.
   *
   * The send is scheduled: the funds are deposited on-chain now and the private
   * withdrawal to the recipient settles afterwards. Use `scheduleId` with
   * {@link getSendStatus} to track that withdrawal.
   *
   * @param {EvmTransferOptions} options - The transfer's options (`amount` in base units).
   * @returns {Promise<{ depositTxHash: string, scheduleId: string }>} The deposit
   *   transaction's hash and the scheduled send's id.
   * @throws {InvalidRecipientError} If the recipient address is invalid.
   * @throws {InvalidAmountError} If the amount is not positive.
   * @throws {ProviderNotConnectedError} If the wallet is not connected to a provider.
   */
  async privateSend ({ token, recipient, amount }) {
    if (!isAddress(recipient)) {
      throw new InvalidRecipientError(recipient)
    }
    let parsedAmount
    try {
      parsedAmount = BigInt(amount)
    } catch {
      throw new InvalidAmountError(amount)
    }
    if (parsedAmount <= 0n) {
      throw new InvalidAmountError(amount)
    }
    const [hinkal, chainId] = await Promise.all([
      this._prepareHinkal(),
      this._chainId()
    ])
    return hinkal.depositAndWithdraw(
      chainId,
      token,
      [parsedAmount],
      [recipient]
    )
  }

  /**
   * Returns the status of a scheduled private send.
   *
   * @param {string} scheduleId - The id returned by {@link privateSend}.
   * @returns {Promise<ScheduledTransactionStatus>} The send's status.
   * @throws {ProviderNotConnectedError} If the wallet is not connected to a provider.
   */
  async getSendStatus (scheduleId) {
    const hinkal = await this._prepareHinkal()
    return hinkal.checkSendTransactionStatus(scheduleId)
  }

  /**
   * Withdraws this account's stuck Hinkal UTXOs of a token back to its own address.
   *
   * @param {{ token: string }} options - The options (only `token` is used).
   * @returns {Promise<{ hashes: string[] }>} The withdrawal transactions' hashes.
   * @throws {ProviderNotConnectedError} If the wallet is not connected to a provider.
   */
  async withdrawStuckUtxos ({ token }) {
    const [hinkal, chainId, recipient] = await Promise.all([
      this._prepareHinkal(),
      this._chainId(),
      this.getAddress()
    ])
    return {
      hashes: await hinkal.withdrawStuckUtxos(chainId, token, recipient)
    }
  }

  /**
   * Returns this account's stuck Hinkal shielded balances (UTXOs awaiting recovery).
   *
   * @returns {Promise<StuckUtxoBalance[]>} The stuck balance per token.
   * @throws {ProviderNotConnectedError} If the wallet is not connected to a provider.
   */
  async stuckUtxoBalances () {
    const [hinkal, chainId] = await Promise.all([
      this._prepareHinkal(),
      this._chainId()
    ])
    const balances = await hinkal.getStuckShieldedBalances(chainId)
    return balances.map(({ erc20Address, balance }) => ({
      token: erc20Address,
      balance
    }))
  }
}
