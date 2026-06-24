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
import { getERC20Token, createSigner, createJsonRpcProvider } from '@hinkal/common'
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
   * Validates the provider connection and token support, then prepares a Hinkal session.
   *
   * @private
   * @param {string} token - The token address to validate.
   * @returns {Promise<{ hinkal: import('@hinkal/common').Hinkal<unknown>, erc20Token: object }>}
   * @throws {Error} If the wallet is not connected to a provider.
   * @throws {Error} If the token is not supported by Hinkal on the current chain.
   */
  async _prepareHinkal (token) {
    if (!this._account.provider) {
      throw new Error('The wallet must be connected to a provider.')
    }
    const { chainId } = await this._provider.getNetwork()
    const erc20Token = getERC20Token(token, Number(chainId))
    if (!erc20Token) {
      throw new Error(`The token ${token} is not supported by Hinkal on chain ${chainId}.`)
    }
    const hinkal = await this._createHinkalSession(chainId)
    return { hinkal, erc20Token }
  }

  /**
   * Creates a Hinkal session from this account's signing key on the given chain.
   *
   * @private
   * @param {bigint | number} chainId - The chain to connect the Hinkal signer to.
   * @returns {Promise<import('@hinkal/common').Hinkal<unknown>>} The prepared Hinkal session.
   */
  async _createHinkalSession (chainId) {
    const privKeyBuf = this._account.signingKey.privateKeyBuffer
    const hexKey = '0x' + Array.from(privKeyBuf).map(b => b.toString(16).padStart(2, '0')).join('')
    const hinkalSigner = createSigner(hexKey).connect(createJsonRpcProvider(Number(chainId)))
    return prepareEthersHinkal(hinkalSigner)
  }

  /**
   * Sends a token to another address privately through Hinkal.
   *
   * @param {EvmTransferOptions} options - The transfer's options (`amount` in base units).
   * @returns {Promise<{ hash: string }>} The transaction hash.
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
    const { hinkal, erc20Token } = await this._prepareHinkal(token)
    const hash = await hinkal.depositAndWithdraw(erc20Token, [parsedAmount], [recipient])
    return { hash }
  }

  /**
   * Withdraws this account's stuck Hinkal UTXOs of a token back to its own address.
   *
   * @param {{ token: string }} options - The options (only `token` is used).
   * @returns {Promise<{ hashes: string[] }>} The withdrawal transactions' hashes.
   * @throws {Error} If the token is not supported by Hinkal on the account's chain.
   */
  async withdrawStuckUtxos ({ token }) {
    const { hinkal, erc20Token } = await this._prepareHinkal(token)
    const recipient = await this.getAddress()
    const hashes = await hinkal.withdrawStuckUtxos(erc20Token, recipient)
    return { hashes }
  }

  /**
   * Returns this account's stuck Hinkal shielded balances (UTXOs awaiting recovery).
   *
   * @returns {Promise<StuckUtxoBalance[]>} The stuck balance per token.
   * @throws {Error} If the wallet is not connected to a provider.
   */
  async stuckUtxoBalances () {
    if (!this._account.provider) {
      throw new Error('The wallet must be connected to a provider.')
    }
    const { chainId } = await this._provider.getNetwork()
    const hinkal = await this._createHinkalSession(chainId)
    const balances = await hinkal.getStuckShieldedBalances(Number(chainId))
    return balances.map(({ token, balance }) => ({ token: token.erc20TokenAddress, balance }))
  }
}
