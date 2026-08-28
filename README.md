# @hinkal/wdk-wallet-evm-hinkal-hinkal

[![Built with WDK](https://raw.githubusercontent.com/Hinkal-Protocol/wdk-wallet-evm-hinkal/main/assets/built-with-wdk.svg)](https://docs.wdk.tether.io)

Adds [Hinkal](https://hinkal-team.gitbook.io/hinkal) private-transfer support to EVM wallets built with [WDK](https://docs.wdk.tether.io).

Hinkal is a privacy protocol that shields token transfers on-chain. This package wraps [`@tetherto/wdk-wallet-evm`](https://www.npmjs.com/package/@tetherto/wdk-wallet-evm) and adds four methods to every account:

- **`privateSend`** — schedule a private send. Funds are deposited on-chain immediately; the shielded withdrawal to the recipient settles afterwards. Returns a `depositTxHash` and a `scheduleId` for tracking.
- **`getSendStatus`** — check the status of a scheduled private send using the `scheduleId` returned by `privateSend`.
- **`withdrawStuckUtxos`** — recover any shielded balances that got stuck in Hinkal back to your own address.
- **`stuckUtxoBalances`** — check how much shielded balance is recoverable per token.

All existing WDK wallet methods work unchanged.

## Interface

Implements the [`@tetherto/wdk-wallet-evm`](https://github.com/tetherto/wdk-wallet-evm) `WalletManagerEvm` / `WalletAccountEvm` interface.

## Installation

```sh
npm install @hinkal/wdk-wallet-evm-hinkal-hinkal
```

## Usage

```js
import WalletManagerEvmHinkal from "@hinkal/wdk-wallet-evm-hinkal";

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

The manager accepts **only a BIP-39 seed phrase or seed bytes**. Hinkal derives
its shielded keys from the seed, so a pre-built signer — including a hardware
signer, or one named through the `signerName` option — cannot back a Hinkal
account. Passing one raises `InvalidSignerError` at construction rather than
failing later at first account access.

| Option     | Type                 | Default | Description                                                |
| ---------- | -------------------- | ------- | ---------------------------------------------------------- |
| `provider` | `string \| string[]` | —       | RPC URL(s) for the chain. Multiple enable failover.        |
| `retries`  | `number`             | `3`     | Failover provider retry count (when `provider` is a list). |

`transactionMaxFee` and `transferMaxFee` are honoured by the inherited
`sendTransaction` and `transfer`, which quote a transaction before sending it.
They do **not** apply to `privateSend`: Hinkal builds, signs, and submits the
deposit inside the SDK, which exposes no pre-flight quote, so there is no cost
to compare against a cap before the funds move. The relayer's fee is separate
again and is taken from the shielded amount. Callers needing a ceiling should
check `quoteSendTransaction` against their own limit, or constrain the amount.

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

This module's own errors extend `HinkalError`, which extends WDK's `WdkError`.
Each carries an `isUserActionable` flag so a wallet UI can tell end-user errors
(bad input) apart from developer errors (misconfiguration). Conditions WDK
already models — a missing provider, an unusable signer — raise WDK's own typed
errors rather than Hinkal-specific ones:

```js
import { HinkalError } from "@hinkal/wdk-wallet-evm-hinkal";

try {
  await account.privateSend(opts);
} catch (err) {
  if (err instanceof HinkalError && err.isUserActionable) {
    // surface err.message to the user
  }
}
```

| Error                   | User-actionable | Thrown when                                                          |
| ----------------------- | :-------------: | -------------------------------------------------------------------- |
| `InvalidRecipientError` |       yes       | `privateSend` receives an invalid recipient address.                 |
| `InvalidAmountError`    |       yes       | `privateSend` receives a non-positive amount.                        |
| `HinkalError`           |        —        | Base class for this module's errors; extends `WdkError`.             |
| `ProviderRequiredError` |        —        | An operation runs while the wallet is not connected to a provider.   |
| `InvalidSignerError`    |        —        | The manager is given a signer instead of a seed, or a `signerName`.  |

`ProviderRequiredError` and `InvalidSignerError` come from
`@tetherto/wdk-wallet` and are re-exported here for convenience.

Errors originating in the Hinkal SDK (network, relayer, proof generation,
unsupported token) propagate as-is.

## Runtime support

Tested on Node.js. Not verified under [Bare](https://github.com/holepunchto/bare):
`@hinkal/common` reaches for `fs`, `crypto`, `worker_threads`, and
`child_process`, and pulls in `bfj` and `dotenv`, so proof generation and the
relayer client are unlikely to work under Bare without shims. `bare-node-runtime`
is declared for parity with `@tetherto/wdk-wallet-evm`, not as a compatibility
claim. Treat Bare support as unverified until it is exercised end to end.

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
