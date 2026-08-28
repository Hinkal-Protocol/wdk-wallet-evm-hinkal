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

export { default } from './src/wallet-manager-evm-hinkal.js'

export { default as WalletAccountEvmHinkal } from './src/wallet-account-evm-hinkal.js'

export {
  HinkalError,
  InvalidRecipientError,
  InvalidAmountError
} from './src/errors.js'

// Re-exported for convenience: thrown by this package's public methods.
export {
  WdkError,
  InvalidSignerError,
  ProviderRequiredError
} from '@tetherto/wdk-wallet'
