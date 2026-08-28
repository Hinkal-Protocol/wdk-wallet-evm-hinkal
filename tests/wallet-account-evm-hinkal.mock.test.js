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

// Mocked unit tests for the four methods that call into the Hinkal SDK
// (privateSend, getSendStatus, withdrawStuckUtxos, stuckUtxoBalances). These
// exercise this module's own logic — argument wiring, return-value shaping,
// the not-connected guard — without a live RPC/testnet, so they run in any CI
// environment. They complement, not replace, the real testnet integration
// tests in wallet-account-evm-hinkal.test.js, which are what actually proves
// the Hinkal SDK integration itself works end to end.

jest.mock('@hinkal/common/providers/prepareEthersHinkal')

const { prepareEthersHinkal } = require('@hinkal/common/providers/prepareEthersHinkal')

const WalletAccountEvmHinkal =
  require('../src/wallet-account-evm-hinkal.js').default

const OFFLINE_SEED =
  'test test test test test test test test test test test junk'
const RECIPIENT = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
const TOKEN = '0x0000000000000000000000000000000000dEaD'

/** @returns {WalletAccountEvmHinkal} An account with a stubbed provider/network, no real RPC. */
function accountWithStubProvider () {
  const account = new WalletAccountEvmHinkal(OFFLINE_SEED, "0'/0/0")
  account._provider = {
    getNetwork: jest.fn().mockResolvedValue({ chainId: 11155111n })
  }
  return account
}

describe('WalletAccountEvmHinkal (mocked Hinkal SDK)', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('privateSend calls depositAndWithdraw with the parsed amount and chain id', async () => {
    const depositAndWithdraw = jest
      .fn()
      .mockResolvedValue({ depositTxHash: '0xabc', scheduleId: 'sched-1' })
    prepareEthersHinkal.mockResolvedValue({ depositAndWithdraw })

    const account = accountWithStubProvider()
    const result = await account.privateSend({
      token: TOKEN,
      recipient: RECIPIENT,
      amount: 5n
    })

    expect(depositAndWithdraw).toHaveBeenCalledWith(
      11155111,
      TOKEN,
      [5n],
      [RECIPIENT]
    )
    expect(result).toEqual({ depositTxHash: '0xabc', scheduleId: 'sched-1' })
  })

  test('getSendStatus returns the SDK status for a scheduleId', async () => {
    const checkSendTransactionStatus = jest.fn().mockResolvedValue({
      scheduleId: 'sched-1',
      chainId: 11155111,
      hashedEthereumAddress: null,
      transactions: []
    })
    prepareEthersHinkal.mockResolvedValue({ checkSendTransactionStatus })

    const account = accountWithStubProvider()
    const status = await account.getSendStatus('sched-1')

    expect(checkSendTransactionStatus).toHaveBeenCalledWith('sched-1')
    expect(status.scheduleId).toBe('sched-1')
  })

  test('withdrawStuckUtxos withdraws to the account address and returns tx hashes', async () => {
    const withdrawStuckUtxos = jest.fn().mockResolvedValue(['0x111', '0x222'])
    prepareEthersHinkal.mockResolvedValue({ withdrawStuckUtxos })

    const account = accountWithStubProvider()
    account.getAddress = jest.fn().mockResolvedValue(RECIPIENT)

    const result = await account.withdrawStuckUtxos({ token: TOKEN })

    expect(withdrawStuckUtxos).toHaveBeenCalledWith(11155111, TOKEN, RECIPIENT)
    expect(result).toEqual({ hashes: ['0x111', '0x222'] })
  })

  test('stuckUtxoBalances maps erc20Address to token in the returned balances', async () => {
    const getStuckShieldedBalances = jest.fn().mockResolvedValue([
      { erc20Address: TOKEN, balance: 42n }
    ])
    prepareEthersHinkal.mockResolvedValue({ getStuckShieldedBalances })

    const account = accountWithStubProvider()
    const balances = await account.stuckUtxoBalances()

    expect(getStuckShieldedBalances).toHaveBeenCalledWith(11155111)
    expect(balances).toEqual([{ token: TOKEN, balance: 42n }])
  })

  test('the Hinkal session is created once and reused across calls', async () => {
    const getStuckShieldedBalances = jest.fn().mockResolvedValue([])
    prepareEthersHinkal.mockResolvedValue({ getStuckShieldedBalances })

    const account = accountWithStubProvider()
    await account.stuckUtxoBalances()
    await account.stuckUtxoBalances()

    expect(prepareEthersHinkal).toHaveBeenCalledTimes(1)
  })

  test('a failed session is not cached, so the next call retries', async () => {
    const getStuckShieldedBalances = jest.fn().mockResolvedValue([])
    prepareEthersHinkal
      .mockRejectedValueOnce(new Error('relayer unreachable'))
      .mockResolvedValueOnce({ getStuckShieldedBalances })

    const account = accountWithStubProvider()

    await expect(account.stuckUtxoBalances()).rejects.toThrow(
      'relayer unreachable'
    )
    await expect(account.stuckUtxoBalances()).resolves.toEqual([])

    expect(prepareEthersHinkal).toHaveBeenCalledTimes(2)
  })

  test('all four methods reject when the wallet is not connected to a provider', async () => {
    const account = new WalletAccountEvmHinkal(OFFLINE_SEED, "0'/0/0")

    await expect(
      account.privateSend({ token: TOKEN, recipient: RECIPIENT, amount: 1n })
    ).rejects.toThrow('provider')
    await expect(account.getSendStatus('sched-1')).rejects.toThrow('provider')
    await expect(
      account.withdrawStuckUtxos({ token: TOKEN })
    ).rejects.toThrow('provider')
    await expect(account.stuckUtxoBalances()).rejects.toThrow('provider')

    expect(prepareEthersHinkal).not.toHaveBeenCalled()
  })
})
