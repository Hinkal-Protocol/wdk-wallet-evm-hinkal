/**
 * A wallet manager for EVM blockchains whose accounts support Hinkal private transfers.
 */
export default class WalletManagerEvmHinkal extends WalletManagerEvm {
  /**
   * Returns the Hinkal-enabled wallet account at a specific BIP-44 derivation path.
   *
   * @param {string} path - The derivation path (e.g. "0'/0/0").
   * @returns {Promise<WalletAccountEvmHinkal>} The account.
   */
  getAccountByPath(path: string): Promise<WalletAccountEvmHinkal>;
}
import WalletManagerEvm from "@tetherto/wdk-wallet-evm";
import WalletAccountEvmHinkal from "./wallet-account-evm-hinkal.js";
