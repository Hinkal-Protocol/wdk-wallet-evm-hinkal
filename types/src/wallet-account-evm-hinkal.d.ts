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
   * Returns the account's Hinkal session, creating it on first use.
   *
   * @private
   * @returns {Promise<import('@hinkal/common').Hinkal<unknown>>}
   * @throws {ProviderNotConnectedError} If the wallet is not connected to a provider.
   */
  private _prepareHinkal;
  _hinkalSession: Promise<import("@hinkal/common").Hinkal<unknown>>;
  /**
   * Returns the chain id the account's provider is connected to.
   *
   * @private
   * @returns {Promise<number>}
   * @throws {ProviderNotConnectedError} If the wallet is not connected to a provider.
   */
  private _chainId;
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
  privateSend({ token, recipient, amount }: EvmTransferOptions): Promise<{
    depositTxHash: string;
    scheduleId: string;
  }>;
  /**
   * Returns the status of a scheduled private send.
   *
   * @param {string} scheduleId - The id returned by {@link privateSend}.
   * @returns {Promise<import('@hinkal/common').ScheduledTransactionByIdResponse>} The send's status.
   * @throws {ProviderNotConnectedError} If the wallet is not connected to a provider.
   */
  getSendStatus(
    scheduleId: string,
  ): Promise<import("@hinkal/common").ScheduledTransactionByIdResponse>;
  /**
   * Withdraws this account's stuck Hinkal UTXOs of a token back to its own address.
   *
   * @param {{ token: string }} options - The options (only `token` is used).
   * @returns {Promise<{ hashes: string[] }>} The withdrawal transactions' hashes.
   * @throws {ProviderNotConnectedError} If the wallet is not connected to a provider.
   */
  withdrawStuckUtxos({ token }: { token: string }): Promise<{
    hashes: string[];
  }>;
  /**
   * Returns this account's stuck Hinkal shielded balances (UTXOs awaiting recovery).
   *
   * @returns {Promise<StuckUtxoBalance[]>} The stuck balance per token.
   * @throws {ProviderNotConnectedError} If the wallet is not connected to a provider.
   */
  stuckUtxoBalances(): Promise<StuckUtxoBalance[]>;
}
export type EvmTransferOptions =
  import("@tetherto/wdk-wallet-evm").EvmTransferOptions;
export type StuckUtxoBalance = {
  /**
   * - The token's address.
   */
  token: string;
  /**
   * - The recoverable shielded balance, in base units.
   */
  balance: bigint;
};
import { WalletAccountEvm } from "@tetherto/wdk-wallet-evm";
