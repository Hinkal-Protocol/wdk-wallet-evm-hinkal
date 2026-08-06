# @hinkal/wdk-wallet-evm

[![Built with WDK](https://raw.githubusercontent.com/Hinkal-Protocol/wdk-wallet-evm-hinkal/main/assets/built-with-wdk.svg)](https://docs.wdk.tether.io)

Adds [Hinkal](https://hinkal-team.gitbook.io/hinkal) private-transfer support to EVM wallets built with [WDK](https://docs.wdk.tether.io).

Hinkal is a privacy protocol that shields token transfers on-chain. This package wraps [`@tetherto/wdk-wallet-evm`](https://www.npmjs.com/package/@tetherto/wdk-wallet-evm) and adds four methods to every account:

- **`privateSend`** — schedule a private send. Funds are deposited on-chain immediately; the shielded withdrawal to the recipient settles afterwards. Returns a `depositTxHash` and a `scheduleId` for tracking.
- **`getSendStatus`** — check the status of a scheduled private send using the `scheduleId` returned by `privateSend`.
- **`withdrawStuckUtxos`** — recover any shielded balances that got stuck in Hinkal back to your own address.
- **`stuckUtxoBalances`** — check how much shielded balance is recoverable per token.

All existing WDK wallet methods work unchanged.

## Interface

Implements the [`@tetherto/wdk-wallet-evm`](https://github.com/tetherto/wdk-wallet/tree/main/src) `WalletManagerEvm` / `WalletAccountEvm` interface.

- `@tetherto/wdk-wallet-evm`: `^1.0.0-beta.16`
- `@hinkal/common`: `^0.3.2`

## Installation

```sh
npm install @hinkal/wdk-wallet-evm
```

> Requires a bundler (Vite, webpack, or Metro) — `@hinkal/common` is not plain Node.js ESM compatible.
>
> In browser environments, Hinkal's zero-knowledge proofs run in WebAssembly, so
> the page's Content Security Policy must allow `'wasm-unsafe-eval'` under
> `script-src` for the cryptographic operations to run.
>
> **Bare runtime is not currently supported.** A `bare.js` entry point and the
> `bare-node-runtime` mapping are provided, but loading fails: `snarkjs`
> (a transitive dependency used by `@hinkal/common` for zero-knowledge proof
> generation, via `fastfile`) reads Node's raw `fs` open-flag constants
> (`O_CREAT` etc.) directly, which `bare-node-runtime` does not map to Bare's
> filesystem model. This is upstream of this package and needs a fix in
> `@hinkal/common`'s dependency chain, not in this module.

## Usage

```js
import WalletManagerEvmHinkal from "@hinkal/wdk-wallet-evm";

const wallet = new WalletManagerEvmHinkal(seed, {
  provider: "https://ethereum-sepolia-rpc.publicnode.com", // any EVM RPC
});
const account = await wallet.getAccount(0);

// Send tokens privately through Hinkal.
const { depositTxHash, scheduleId } = await account.privateSend({
  token: "0x...", // an ERC-20 supported by Hinkal on the connected chain
  recipient: "0x...",
  amount: 1_000_000n, // in the token's base units
});

// Track the scheduled withdrawal.
const status = await account.getSendStatus(scheduleId);

// Inspect and recover stuck shielded balances.
const balances = await account.stuckUtxoBalances();
const { hashes } = await account.withdrawStuckUtxos({ token: "0x..." });
```

See [`examples/`](./examples) for a runnable script.

## Configuration

Configuration is passed to the `WalletManagerEvmHinkal` constructor and forwarded to the underlying WDK EVM wallet.

| Option     | Type                 | Default | Description                                                |
| ---------- | -------------------- | ------- | ---------------------------------------------------------- |
| `provider` | `string \| string[]` | —       | RPC URL(s) for the chain. Multiple enable failover.        |
| `retries`  | `number`             | `3`     | Failover provider retry count (when `provider` is a list). |

Chain selection is implicit: operations run on the chain the configured `provider` is connected to.

For anything beyond light testing, use an RPC endpoint from a provider such as
Alchemy or Infura rather than a public RPC — these require your own API key
(see `.env.example`) and are subject to that provider's rate limits and usage
restrictions. Hinkal's own relayer and API are also subject to their own rate
limits; see the [Hinkal docs](https://hinkal-team.gitbook.io/hinkal) for
current limits.

## Supported networks

Any EVM chain that Hinkal supports and that the configured provider is connected to (for example Optimism, Arbitrum, Ethereum, Base). See the [Hinkal docs](https://hinkal-team.gitbook.io/hinkal) for the current list. Errors raised by the underlying Hinkal SDK (for example an unsupported token) are passed through unchanged.

## Errors

This module's own errors extend `HinkalError`, which extends `Error`. Each
carries an `isUserActionable` flag so a wallet UI can tell end-user errors (bad
input) apart from developer errors (misconfiguration):

```js
import { HinkalError } from "@hinkal/wdk-wallet-evm";

try {
  await account.privateSend(opts);
} catch (err) {
  if (err instanceof HinkalError && err.isUserActionable) {
    // surface err.message to the user
  }
}
```

| Error                       | User-actionable | Thrown when                                                        |
| --------------------------- | :-------------: | ------------------------------------------------------------------ |
| `InvalidRecipientError`     |       yes       | `privateSend` receives an invalid recipient address.               |
| `InvalidAmountError`        |       yes       | `privateSend` receives a non-positive amount.                      |
| `ProviderNotConnectedError` |       no        | An operation runs while the wallet is not connected to a provider. |
| `HinkalError`               |        —        | Base class for all of the above.                                   |

Errors originating in the Hinkal SDK (network, relayer, proof generation,
unsupported token) propagate as-is.

## Testing

```sh
npm test
npm run test:coverage
```

Runs the unit tests (real modules, no network) plus the integration tests
(real Hinkal SDK against a live EVM testnet). The integration tests skip
themselves unless a `.env` provides the required vars — `SEED`, `RPC_URL`,
`TOKEN`, `CHAIN_ID`, `RECIPIENT`, `AMOUNT` (see
[`.env.example`](./.env.example)). When set, `npm test` **moves real funds**.

## Support

- Discord: <https://discord.com/invite/xYGJTJbZy7>
- Issues: <https://github.com/Hinkal-Protocol/wdk-wallet-evm-hinkal/issues>
- Security disclosures: see [SECURITY.md](./SECURITY.md)

## License

Apache-2.0
