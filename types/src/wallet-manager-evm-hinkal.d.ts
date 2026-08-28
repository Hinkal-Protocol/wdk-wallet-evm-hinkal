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
    constructor(seedOrSigner: string | Uint8Array, config?: import("@tetherto/wdk-wallet-evm").EvmWalletConfig);
    _hinkalSeed: string | Uint8Array<ArrayBufferLike>;
    /**
     * Returns the Hinkal-enabled wallet account at a specific BIP-44 derivation path.
     *
     * @param {string} path - The derivation path (e.g. "0'/0/0").
     * @returns {Promise<WalletAccountEvmHinkal>} The account.
     * @throws {Error} If the manager was constructed with a pre-built signer instead of a seed.
     */
    getAccountByPath(path: string): Promise<WalletAccountEvmHinkal>;
}
import WalletManagerEvm from '@tetherto/wdk-wallet-evm';
import WalletAccountEvmHinkal from './wallet-account-evm-hinkal.js';
