import { describe, expect, it } from "vitest";
import { TestnetCustodyProvider } from "./providers/testnetProvider";
import { validateAddress } from "./security/validation";

const provider = new TestnetCustodyProvider();

function walletInput(walletPublicId: string) {
  return { walletPublicId, userPublicId: "user-1", networkMode: "testnet" as const };
}

describe("TestnetCustodyProvider", () => {
  it("is explicitly labeled testnet-only", () => {
    expect(provider.name).toBe("testnet");
    expect(provider.networkMode).toBe("testnet");
  });

  it("creates deterministic custody wallet references without key material", async () => {
    const first = await provider.createWallet(walletInput("wallet-abc"));
    const second = await provider.createWallet(walletInput("wallet-abc"));
    expect(first.custodyWalletRef).toBe(second.custodyWalletRef);
    expect(first.custodyWalletRef.startsWith("testnet-wallet-")).toBe(true);
    expect(JSON.stringify(first)).not.toMatch(/private|seed|secret|mnemonic/i);
  });

  it("generates valid, deterministic deposit addresses per asset/network", async () => {
    const wallet = await provider.createWallet(walletInput("wallet-xyz"));
    const input = {
      custodyWalletRef: wallet.custodyWalletRef,
      walletPublicId: "wallet-xyz",
      assetSymbol: "BTC",
      networkCode: "BTC_TESTNET",
      chainType: "bitcoin",
      networkMode: "testnet" as const,
    };
    const first = await provider.createDepositAddress(input);
    const second = await provider.createDepositAddress(input);
    expect(first.address).toBe(second.address);
    expect(validateAddress(first.address, "bitcoin")).toBe(true);
    expect(first.address.startsWith("tb1")).toBe(true);

    const eth = await provider.createDepositAddress({
      ...input,
      assetSymbol: "ETH",
      networkCode: "ETH_SEPOLIA",
      chainType: "ethereum",
    });
    expect(validateAddress(eth.address, "ethereum")).toBe(true);
    expect(eth.address).not.toBe(first.address);
  });

  it("never shares an address across different custody wallets", async () => {
    const a = await provider.createWallet(walletInput("wallet-a"));
    const b = await provider.createWallet(walletInput("wallet-b"));
    const base = {
      walletPublicId: "wallet-a",
      assetSymbol: "BTC",
      networkCode: "BTC_TESTNET",
      chainType: "bitcoin",
      networkMode: "testnet" as const,
    };
    const addressA = await provider.createDepositAddress({ ...base, custodyWalletRef: a.custodyWalletRef });
    const addressB = await provider.createDepositAddress({ ...base, custodyWalletRef: b.custodyWalletRef });
    expect(addressA.address).not.toBe(addressB.address);
  });

  it("runs a pending → confirmed withdrawal lifecycle", async () => {
    const submitted = await provider.submitWithdrawal({
      idempotencyKey: "test-idempotency-key",
      custodyWalletRef: "testnet-wallet-x",
      assetSymbol: "BTC",
      networkCode: "BTC_TESTNET",
      destinationAddress: "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kg3g4ty",
      amount: "0.001",
      feeAmount: "0.0001",
      networkMode: "testnet",
    });
    expect(submitted.status).toBe("pending");
    expect(submitted.providerWithdrawalRef.startsWith("testnet-wd-")).toBe(true);

    const pending = await provider.getWithdrawalStatus(submitted.providerWithdrawalRef);
    expect(pending.status).toBe("pending");

    const settled = await provider.getWithdrawalStatus("testnet-wd-unknown-ref");
    expect(settled.status).toBe("confirmed");
    expect(settled.blockchainTxHash?.startsWith("testnet-tx-")).toBe(true);
  });
});
