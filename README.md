# wdk-wallet-evm-hinkal

A [WDK](https://docs.wdk.tether.io) community wallet module that adds [Hinkal](https://hinkal.pro)
private transfers to EVM wallet accounts.

It extends [`@tetherto/wdk-wallet-evm`](https://www.npmjs.com/package/@tetherto/wdk-wallet-evm),
so every standard account method keeps working and three Hinkal methods are added on top:

- `privateSend` — shielded deposit and withdrawal to a recipient in a single call.
- `withdrawStuckUtxos` — recover stranded shielded UTXOs back to your own address.
- `stuckUtxoBalances` — list recoverable shielded balances per token.

## Installation

```sh
npm install @hinkal/wdk-wallet-evm-hinkal
```

> **Note:** This module depends on `@hinkal/common`, which is distributed for bundled
> environments. Use it through a bundler (Vite, webpack, React Native / Metro, or bare) rather
> than plain Node.js ESM.

## Usage

```js
import WalletManagerEvmHinkal from '@hinkal/wdk-wallet-evm-hinkal'

const wallet = new WalletManagerEvmHinkal(seed, { provider: 'https://mainnet.optimism.io' })
const account = await wallet.getAccount(0)

// Send 1 USDC privately through Hinkal.
const { hash } = await account.privateSend({
  token: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
  recipient: '0x...',
  amount: 1_000_000n
})

// Inspect and recover stuck shielded balances.
const balances = await account.stuckUtxoBalances()
if (balances.length > 0) {
  await account.withdrawStuckUtxos({ token: balances[0].token })
}
```

## API

### `account.privateSend({ token, recipient, amount }) => Promise<{ hash }>`

Privately transfers `amount` (base units) of `token` to `recipient` via Hinkal's
`depositAndWithdraw`. Throws if the recipient is not a valid address, the amount is not
positive, or the token is unsupported on the account's chain.

### `account.withdrawStuckUtxos({ token }) => Promise<{ hashes }>`

Recovers stranded shielded UTXOs of `token` back to the account's own address.

### `account.stuckUtxoBalances() => Promise<Array<{ token, balance }>>`

Returns the recoverable shielded balance per token. An empty array means nothing is stuck.

## License

Apache-2.0
