# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.4] - 2026-08-06

### Changed

- Bump `@tetherto/wdk-wallet-evm` from `1.0.0-beta.13` to `1.0.0-beta.16`.
  The base `WalletAccountEvm`/`WalletManagerEvm` classes no longer expose a
  public ethers `Signer` (replaced with Tether's own `ISignerEvm`
  abstraction), so `WalletAccountEvmHinkal` and `WalletManagerEvmHinkal` now
  independently derive their own ethers `HDNodeWallet` from the account's
  seed/path to keep calling `@hinkal/common`'s `prepareEthersHinkal`.
- Bump `@hinkal/common` to `0.3.4`, resolving all npm audit vulnerabilities
  (24 → 0) via dependency bumps and `overrides` for `underscore`/`ws` in the
  Solana/Tron dependency chain.
- Fixed the "Built with WDK" README badge (was the wrong badge type/image).

### Added

- Mocked unit tests (`tests/wallet-account-evm-hinkal.mock.test.js`) covering
  `privateSend`, `getSendStatus`, `withdrawStuckUtxos`, `stuckUtxoBalances`,
  session caching, and the not-connected guard, so coverage no longer depends
  on `.env`-gated live-network tests. Coverage: 65% → 96%.
- `npm run test`/`test:coverage` no longer need `--forceExit`; the beta.16
  signer fix also resolved the Jest open-handle hang from the old signer's
  teardown.

## [0.0.3] - 2026-07-31

### Changed

- Bump `@hinkal/common` from `0.3.1` to `0.3.2`.

### Fixed

- `getSendStatus`'s return type referenced `@hinkal/common`'s
  `ScheduledTransactionByIdResponse`, which is not reachable through the
  package's public `exports` map. Replaced with a locally defined
  `ScheduledTransactionStatus` type mirroring the same shape.
- The integration test suite failed to load entirely (not just skip) when run
  without `.env` set, due to an account being constructed eagerly at
  `describe`-body scope. Moved into `beforeAll`.

## [0.0.2] - 2026-07-01

Initial release. Adds Hinkal private-transfer support to EVM wallet accounts,
built against `@hinkal/common` `^0.3.1`.

### Added

- `privateSend` — schedule a private send. Returns `{ depositTxHash, scheduleId }`.
- `getSendStatus` — query the status of a scheduled private send.
- `withdrawStuckUtxos` — recover stuck shielded balances to the account address.
- `stuckUtxoBalances` — list recoverable shielded balances per token.
- Typed error classes: `HinkalError`, `ProviderNotConnectedError`,
  `InvalidRecipientError`, `InvalidAmountError`.
- Unit tests covering the full public API and env-gated testnet integration tests.
- Bare runtime entry point (`bare.js`).
