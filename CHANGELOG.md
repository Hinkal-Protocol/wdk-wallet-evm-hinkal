# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
