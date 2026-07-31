export type StuckUtxoBalance = {
    /**
     * - The token's address.
     */
    token: string;
    /**
     * - The recoverable shielded balance, in base units.
     */
    balance: bigint;
};
export type ScheduledTransactionItemStatus = {
    /**
     * - The item's status (e.g. `"pending"`, `"completed"`, `"failed"`).
     */
    status: string;
    /**
     * - When the item is scheduled to run.
     */
    scheduledTime: string;
    /**
     * - The item's transaction hash, once sent on-chain.
     */
    txHash: string | null;
};
export type ScheduledTransactionStatus = {
    /**
     * - The id returned by `privateSend`.
     */
    scheduleId: string;
    /**
     * - The chain the scheduled send runs on.
     */
    chainId: number;
    hashedEthereumAddress: string | null;
    transactions: ScheduledTransactionItemStatus[];
};
