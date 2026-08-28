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

import { WdkError } from '@tetherto/wdk-wallet'

/**
 * Base class for every error thrown by this module. Catch this to handle all
 * Hinkal-specific failures without catching unrelated errors. Extends WDK's
 * `WdkError`, so `catch (e) { if (e instanceof WdkError) ... }` also catches these.
 *
 * `isUserActionable` distinguishes errors a wallet UI should surface to the end
 * user (bad input) from developer errors (misconfiguration).
 */
export class HinkalError extends WdkError {
  /**
   * @param {string} message - The error's message.
   * @param {boolean} [isUserActionable] - Whether an end user can act on it.
   * @param {ErrorOptions} [options] - The error's options, forwarded to `WdkError`.
   */
  constructor (message, isUserActionable = false, options) {
    super(message, options)

    this.name = 'HinkalError'
    this.isUserActionable = isUserActionable
  }
}

/**
 * Thrown when a recipient address is not a valid EVM address.
 * User-actionable: supply a valid address.
 */
export class InvalidRecipientError extends HinkalError {
  /**
   * @param {string} recipient - The offending recipient value.
   */
  constructor (recipient) {
    super(`Invalid recipient address: ${recipient}`, true)

    this.name = 'InvalidRecipientError'
    this.recipient = recipient
  }
}

/**
 * Thrown when a transfer amount is not a positive integer.
 * User-actionable: supply an amount greater than zero.
 */
export class InvalidAmountError extends HinkalError {
  /**
   * @param {bigint | number | string} amount - The offending amount value.
   */
  constructor (amount) {
    super(`Amount must be a positive number: ${amount}`, true)

    this.name = 'InvalidAmountError'
    this.amount = amount
  }
}
