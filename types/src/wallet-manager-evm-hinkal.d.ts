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
  constructor(
    seed: string | Uint8Array,
    config?: import("@tetherto/wdk-wallet-evm").EvmWalletConfig,
  );
  _hinkalSeed: string | Uint8Array<ArrayBufferLike>;
  /**
   * Returns the Hinkal-enabled wallet account at an index.
   *
   * Overridden so that every account is a {@link WalletAccountEvmHinkal}. The base
   * implementation builds a plain account when given a signer name, which would
   * silently drop Hinkal support.
   *
   * @param {number | string} [index] - The account index.
   * @param {{ signerName?: string }} [options] - Account options.
   * @returns {Promise<WalletAccountEvmHinkal>} The account.
   * @throws {InvalidSignerError} If a signer name is supplied.
   */
  getAccount(
    index?: number | string,
    options?: {
      signerName?: string;
    },
  ): Promise<WalletAccountEvmHinkal>;
  /**
   * Returns the Hinkal-enabled wallet account at a specific BIP-44 derivation path.
   *
   * @param {string} path - The derivation path (e.g. "0'/0/0").
   * @param {Object} [options] - Account options.
   * @returns {Promise<WalletAccountEvmHinkal>} The account.
   * @throws {InvalidSignerError} If a signer name is supplied.
   */
  getAccountByPath(
    path: string,
    options?: any,
  ): Promise<WalletAccountEvmHinkal>;
}
import WalletManagerEvm from "@tetherto/wdk-wallet-evm";
import WalletAccountEvmHinkal from "./wallet-account-evm-hinkal.js";
