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
    constructor(message: string, isUserActionable?: boolean, options?: ErrorOptions);
    isUserActionable: boolean;
}
/**
 * Thrown when a recipient address is not a valid EVM address.
 * User-actionable: supply a valid address.
 */
export class InvalidRecipientError extends HinkalError {
    /**
     * @param {string} recipient - The offending recipient value.
     */
    constructor(recipient: string);
    recipient: string;
}
/**
 * Thrown when a transfer amount is not a positive integer.
 * User-actionable: supply an amount greater than zero.
 */
export class InvalidAmountError extends HinkalError {
    /**
     * @param {bigint | number | string} amount - The offending amount value.
     */
    constructor(amount: bigint | number | string);
    amount: string | number | bigint;
}
import { WdkError } from '@tetherto/wdk-wallet';
