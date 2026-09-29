import { describe, expect, it } from "vitest";
import { BalanceLedger } from "./balance";

describe("BalanceLedger", () => {
  it("tracks available and pending balances", () => {
    const ledger = new BalanceLedger();

    const afterDeposit = ledger.applyDeposit({
      walletPublicId: "wallet-1",
      assetSymbol: "BTC",
      networkCode: "BTC_TESTNET",
      amount: "1.5",
    });

    expect(afterDeposit.available).toBe("1.5");
    expect(afterDeposit.pending).toBe("0");
    expect(afterDeposit.total).toBe("1.5");

    const afterWithdrawal = ledger.submitWithdrawal("wallet-1", "BTC", "BTC_TESTNET", "0.5");
    expect(afterWithdrawal.available).toBe("1");
    expect(afterWithdrawal.pending).toBe("0.5");
    expect(afterWithdrawal.total).toBe("1.5");

    const afterConfirm = ledger.confirmWithdrawal("wallet-1", "BTC", "BTC_TESTNET", "0.5");
    expect(afterConfirm.available).toBe("1");
    expect(afterConfirm.pending).toBe("0");
    expect(afterConfirm.total).toBe("1");
  });

  it("prevents withdrawals beyond available balance", () => {
    const ledger = new BalanceLedger();

    ledger.applyDeposit({
      walletPublicId: "wallet-2",
      assetSymbol: "ETH",
      networkCode: "ETH_SEPOLIA",
      amount: "1",
    });

    expect(() => {
      ledger.submitWithdrawal("wallet-2", "ETH", "ETH_SEPOLIA", "2");
    }).toThrow("Insufficient available balance");
  });
});
