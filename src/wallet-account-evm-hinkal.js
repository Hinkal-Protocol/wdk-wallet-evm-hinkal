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

import { isAddress } from 'ethers'

import { WalletAccountEvm } from '@tetherto/wdk-wallet-evm'
import { prepareEthersHinkal } from '@hinkal/common/providers/prepareEthersHinkal'

/** @typedef {import('@tetherto/wdk-wallet-evm').EvmTransferOptions} EvmTransferOptions */

/**
 * @typedef {Object} StuckUtxoBalance
 * @property {string} token - The token's address.
 * @property {bigint} balance - The recoverable shielded balance, in base units.
 */

/**
 * An EVM wallet account with Hinkal private-transfer support.
 *
 * Extends the standard {@link WalletAccountEvm} with private sends and recovery of
 * stranded shielded UTXOs through the Hinkal protocol.
 */
export default class WalletAccountEvmHinkal extends WalletAccountEvm {
  /**
   * Prepares a Hinkal session for the account's current chain.
   *
   * @private
   * @returns {Promise<{ hinkal: import('@hinkal/common').Hinkal<unknown>, chainId: number }>}
   * @throws {Error} If the wallet is not connected to a provider.
   */
  async _prepareHinkal () {
    if (!this._account.provider) {
      throw new Error('The wallet must be connected to a provider.')
    }
    const { chainId } = await this._provider.getNetwork()
    const hinkal = await prepareEthersHinkal(this._account)
    return { hinkal, chainId: Number(chainId) }
  }

  /**
   * Sends a token to another address privately through Hinkal.
   *
   * @param {EvmTransferOptions} options - The transfer's options (`amount` in base units).
   * @returns {Promise<{ hash: string }>} The deposit transaction's hash.
   * @throws {Error} If the recipient address is invalid.
   * @throws {Error} If the amount is not positive.
   * @throws {Error} If the token is not supported by Hinkal on the account's chain.
   */
  async privateSend ({ token, recipient, amount }) {
    if (!isAddress(recipient)) {
      throw new Error('Invalid recipient address.')
    }
    const parsedAmount = BigInt(amount)
    if (parsedAmount <= 0n) {
      throw new Error('Amount must be positive.')
    }
    const { hinkal, chainId } = await this._prepareHinkal()
    const { depositTxHash } = await hinkal.depositAndWithdraw(chainId, token, [parsedAmount], [recipient])
    return { hash: depositTxHash }
  }

  /**
   * Withdraws this account's stuck Hinkal UTXOs of a token back to its own address.
   *
   * @param {{ token: string }} options - The options (only `token` is used).
   * @returns {Promise<{ hashes: string[] }>} The withdrawal transactions' hashes.
   * @throws {Error} If the token is not supported by Hinkal on the account's chain.
   */
  async withdrawStuckUtxos ({ token }) {
    const { hinkal, chainId } = await this._prepareHinkal()
    const recipient = await this.getAddress()
    const hashes = await hinkal.withdrawStuckUtxos(chainId, token, recipient)
    return { hashes }
  }

  /**
   * Returns this account's stuck Hinkal shielded balances (UTXOs awaiting recovery).
   *
   * @returns {Promise<StuckUtxoBalance[]>} The stuck balance per token.
   * @throws {Error} If the wallet is not connected to a provider.
   */
  async stuckUtxoBalances () {
    const { hinkal, chainId } = await this._prepareHinkal()
    const balances = await hinkal.getStuckShieldedBalances(chainId)
    return balances.map(({ token, balance }) => ({ token: token.erc20TokenAddress, balance }))
  }
}
