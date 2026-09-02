# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.7] - 2026-08-28

### Changed

- **Renamed the package to `@hinkal/wdk-wallet-evm-hinkal`.** The previous name,
  `@hinkal/wdk-wallet-evm`, read as a replacement for `@tetherto/wdk-wallet-evm`
  rather than an extension of it, and did not follow WDK's `wdk-wallet-<chain>-<variant>`
  convention. Update imports accordingly.
- Bump `@hinkal/common` from `0.3.8` to `0.3.10`.
- Bump `@tetherto/wdk-wallet-evm` from `1.0.0-beta.16` to `1.0.0-beta.18`, which
  introduces WDK's typed error hierarchy.
- Add `@tetherto/wdk-wallet` as a direct dependency. Its error classes are used
  in this package's public API, so it should not be relied on transitively.
- `WalletManagerEvmHinkal` now accepts only a BIP-39 seed phrase or seed bytes.
  Hinkal derives its shielded keys from the seed, so a pre-built signer could
  never back a Hinkal account; the constructor previously accepted one and failed
  later at the first `getAccount` call. It now raises `InvalidSignerError`
  immediately.
- `HinkalError` extends WDK's `WdkError` instead of `Error`, so callers can catch
  every WDK error uniformly.

### Fixed

- `getAccount(index)` derived `${index}'/0/0` instead of `0'/0/${index}`, so it
  varied the BIP-44 account level where `WalletManagerEvm` varies the address
  index. The two agree at index 0 and diverge above it, so `getAccount(1)` and
  higher returned a different address than the same call on the base manager.

### Removed

- `ProviderNotConnectedError`, in favour of WDK's `ProviderRequiredError`, which
  models the same condition.

### Added

- `getAccount` is overridden so every account is a `WalletAccountEvmHinkal`. The
  inherited implementation builds a plain `WalletAccountEvm` when given a signer
  name, which silently dropped Hinkal support.
- `dispose` is overridden to clear `_hinkalSigner` and `_hinkalSession`. The
  inherited implementation disposes only the parent signer, leaving the Hinkal
  signer's key material reachable.
- Re-export `WdkError`, `InvalidSignerError`, and `ProviderRequiredError`.

### Documentation

- Document that `transactionMaxFee` and `transferMaxFee` do not apply to
  `privateSend`: the SDK builds and submits the deposit internally and exposes no
  pre-flight quote, so no cost can be compared against a cap before funds move.
- Document that the package is not compatible with Bare. `ethers` ships no
  `bare` export condition, so under Bare this package resolves it to its ESM
  build while `@hinkal/common` resolves to CommonJS; the two `AbstractSigner`
  classes make the SDK's signer check fail with `expected signer`.
- Fix the `@tetherto/wdk-wallet-evm` interface link, which pointed at the
  `wdk-wallet` repository.

## [0.0.6] - 2026-08-26

### Changed

- Bump `@hinkal/common` from `0.3.6` to `0.3.8`.
- Bump `ethers` from `6.15.0` to `6.17.0` to match the version
  `@hinkal/common` requires.

## [0.0.5] - 2026-08-11

### Changed

- Bump `@hinkal/common` from `0.3.4` to `0.3.6`. The SDK dropped two
  dependencies it never referenced — `@solana/wallet-adapter-react` and
  `uuid` — and pinned `bfj` to `7.0.2` and `bigint-buffer` to a patched fork.
  Dropping `@solana/wallet-adapter-react` removes the entire `react-native`,
  `metro`, and `@solana-mobile/*` subtree from installs, cutting production
  dependencies roughly in half.
- Add root `overrides` for `uuid` (`^11.1.1`) and `ws` (`^8.21.0`). Neither
  advisory is reachable by upgrading: `jayson` requires `uuid@^8.3.2` and
  `ethers@6.13.5` pins `ws@8.17.1` exactly, both excluding the fixed
  versions. Overriding `ws` also clears the `ethers` and `tronweb` advisories,
  which only flagged a vulnerable `ws`. With the SDK bump this takes
  `npm audit` from 33 to 0 in this repository — note that npm honours
  `overrides` only in the root project, so installs of this package do not
  inherit them.

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
