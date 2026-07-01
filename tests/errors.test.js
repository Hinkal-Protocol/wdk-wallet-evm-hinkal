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

"use strict";

import {
  HinkalError,
  ProviderNotConnectedError,
  InvalidRecipientError,
  InvalidAmountError,
} from "../src/errors.js";

describe("errors", () => {
  test("every error extends HinkalError and Error", () => {
    const errors = [
      new ProviderNotConnectedError(),
      new InvalidRecipientError("0x0"),
      new InvalidAmountError(0n),
    ];
    for (const err of errors) {
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(HinkalError);
    }
  });

  test("flags user-actionable vs developer errors", () => {
    expect(new InvalidRecipientError("0x0").isUserActionable).toBe(true);
    expect(new InvalidAmountError(0n).isUserActionable).toBe(true);
    expect(new ProviderNotConnectedError().isUserActionable).toBe(false);
  });

  test("HinkalError carries its message and name", () => {
    const err = new HinkalError("boom");
    expect(err.name).toBe("HinkalError");
    expect(err.message).toBe("boom");
  });

  test("ProviderNotConnectedError has a stable name and message", () => {
    const err = new ProviderNotConnectedError();
    expect(err.name).toBe("ProviderNotConnectedError");
    expect(err.message).toMatch(/connected to a provider/);
  });

  test("InvalidRecipientError keeps the offending recipient", () => {
    const err = new InvalidRecipientError("not-an-address");
    expect(err.name).toBe("InvalidRecipientError");
    expect(err.recipient).toBe("not-an-address");
    expect(err.message).toContain("not-an-address");
  });

  test("InvalidAmountError keeps the offending amount", () => {
    const err = new InvalidAmountError(-5n);
    expect(err.name).toBe("InvalidAmountError");
    expect(err.amount).toBe(-5n);
    expect(err.message).toContain("-5");
  });
});
