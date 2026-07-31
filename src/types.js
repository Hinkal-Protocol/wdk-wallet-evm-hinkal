// Copyright 2026 Hinkal Protocol
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict'

/**
 * @typedef {Object} StuckUtxoBalance
 * @property {string} token - The token's address.
 * @property {bigint} balance - The recoverable shielded balance, in base units.
 */

/**
 * @typedef {Object} ScheduledTransactionItemStatus
 * @property {string} status - The item's status (e.g. `"pending"`, `"completed"`, `"failed"`).
 * @property {string} scheduledTime - When the item is scheduled to run.
 * @property {string | null} txHash - The item's transaction hash, once sent on-chain.
 */

/**
 * @typedef {Object} ScheduledTransactionStatus
 * @property {string} scheduleId - The id returned by `privateSend`.
 * @property {number} chainId - The chain the scheduled send runs on.
 * @property {string | null} hashedEthereumAddress
 * @property {ScheduledTransactionItemStatus[]} transactions
 */

export {}
