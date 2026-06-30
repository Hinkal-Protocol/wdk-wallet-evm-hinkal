# @hinkal/wdk-wallet-evm-hinkal

Adds [Hinkal] private transfer support to EVM wallets built with [WDK](https://docs.wdk.tether.io).

Hinkal is a privacy protocol that shields token transfers on-chain. This package wraps `@tetherto/wdk-wallet-evm` and adds three methods to every account:

- **`privateSend`** — send tokens to any address privately. The transfer is shielded through Hinkal so the link between sender and recipient is hidden on-chain.
- **`withdrawStuckUtxos`** — recover any shielded balances that got stuck in Hinkal back to your own address.
- **`stuckUtxoBalances`** — check how much shielded balance is recoverable per token.

All existing WDK wallet methods work unchanged.

## Installation

```sh
npm install @hinkal/wdk-wallet-evm-hinkal
```

## Usage

```js
import WalletManagerEvmHinkal from '@hinkal/wdk-wallet-evm-hinkal'

const wallet = new WalletManagerEvmHinkal(seed, { provider: 'https://mainnet.optimism.io' })
const account = await wallet.getAccount(0)

// Send tokens privately through Hinkal
const { hash } = await account.privateSend({
  token: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', // USDC on Optimism
  recipient: '0x...',
  amount: 1_000_000n // 1 USDC in base units
})
```

> Requires a bundler (Vite, webpack, Metro, or bare) — `@hinkal/common` is not plain Node.js ESM compatible.

## License

Apache-2.0
