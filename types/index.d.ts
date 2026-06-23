import WalletManagerEvm, { WalletAccountEvm } from '@tetherto/wdk-wallet-evm'

export interface PrivateSendOptions {
  /** The token's address. */
  token: string
  /** The recipient's address. */
  recipient: string
  /** The amount to send, in base units. */
  amount: bigint | number | string
}

export interface StuckUtxoBalance {
  /** The token's address. */
  token: string
  /** The recoverable shielded balance, in base units. */
  balance: bigint
}

/** An EVM wallet account with Hinkal private-transfer support. */
export class WalletAccountEvmHinkal extends WalletAccountEvm {
  /** Sends a token to another address privately through Hinkal. */
  privateSend (options: PrivateSendOptions): Promise<{ hash: string }>
  /** Withdraws this account's stuck Hinkal UTXOs of a token back to its own address. */
  withdrawStuckUtxos (options: { token: string }): Promise<{ hashes: string[] }>
  /** Returns this account's stuck Hinkal shielded balances. */
  stuckUtxoBalances (): Promise<StuckUtxoBalance[]>
}

/** A wallet manager for EVM blockchains whose accounts support Hinkal private transfers. */
export default class WalletManagerEvmHinkal extends WalletManagerEvm {
  getAccount (index?: number): Promise<WalletAccountEvmHinkal>
  getAccountByPath (path: string): Promise<WalletAccountEvmHinkal>
}
