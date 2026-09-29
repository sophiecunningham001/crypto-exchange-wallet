import type {
  DepositAddressInput,
  DepositAddressRecord,
  NetworkMode,
  WalletInput,
  WalletRecord,
  WithdrawalRecord,
  WithdrawalStatusResult,
  WithdrawalSubmissionInput,
} from "../types";

function stableHash(input: string): string {
  let hash = 2166136261;

  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    hash ^= code;
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

function normalizeKey(input: Record<string, unknown>): string {
  return Object.keys(input)
    .sort()
    .map((key) => `${key}:${String((input as Record<string, unknown>)[key])}`)
    .join("|");
}

export class TestnetCustodyProvider {
  public readonly name = "testnet";
  public readonly networkMode: NetworkMode = "testnet";

  private wallets = new Map<string, WalletRecord>();
  private depositAddresses = new Map<string, DepositAddressRecord>();
  private withdrawals = new Map<string, WithdrawalRecord>();

  async createWallet(input: WalletInput): Promise<WalletRecord> {
    const key = normalizeKey({
      walletPublicId: input.walletPublicId,
      userPublicId: input.userPublicId,
      networkMode: input.networkMode,
    });

    const existing = this.wallets.get(key);
    if (existing) {
      return existing;
    }

    const custodyWalletRef = `testnet-wallet-${stableHash(key)}`;

    const wallet: WalletRecord = {
      custodyWalletRef,
      walletPublicId: input.walletPublicId,
      userPublicId: input.userPublicId,
      networkMode: input.networkMode,
    };

    this.wallets.set(key, wallet);
    return wallet;
  }

  async createDepositAddress(input: DepositAddressInput): Promise<DepositAddressRecord> {
    const key = normalizeKey({
      custodyWalletRef: input.custodyWalletRef,
      walletPublicId: input.walletPublicId,
      assetSymbol: input.assetSymbol,
      networkCode: input.networkCode,
      chainType: input.chainType,
      networkMode: input.networkMode,
    });

    const existing = this.depositAddresses.get(key);
    if (existing) {
      return existing;
    }

    const address = this.generateAddressForAsset(input);
    const record: DepositAddressRecord = {
      custodyWalletRef: input.custodyWalletRef,
      walletPublicId: input.walletPublicId,
      assetSymbol: input.assetSymbol,
      networkCode: input.networkCode,
      chainType: input.chainType,
      networkMode: input.networkMode,
      address,
    };

    this.depositAddresses.set(key, record);
    return record;
  }

  private generateAddressForAsset(input: DepositAddressInput): string {
    const baseSeed = normalizeKey({
      custodyWalletRef: input.custodyWalletRef,
      walletPublicId: input.walletPublicId,
      assetSymbol: input.assetSymbol,
      networkCode: input.networkCode,
      chainType: input.chainType,
      networkMode: input.networkMode,
    });

    const seed = stableHash(baseSeed);

    if (input.chainType === "bitcoin" || input.networkCode.includes("BTC")) {
      const suffix = seed.slice(0, 30).replace(/[^a-z0-9]/gi, "a");
      return `tb1${suffix}`;
    }

    if (input.chainType === "ethereum" || input.networkCode.includes("ETH")) {
      return `0x${seed.padEnd(40, "0").slice(0, 40)}`;
    }

    return `${input.assetSymbol.toLowerCase()}-${seed}`;
  }

  async submitWithdrawal(input: WithdrawalSubmissionInput): Promise<WithdrawalRecord> {
    const key = normalizeKey({
      idempotencyKey: input.idempotencyKey,
      custodyWalletRef: input.custodyWalletRef,
      assetSymbol: input.assetSymbol,
      networkCode: input.networkCode,
      destinationAddress: input.destinationAddress,
      amount: input.amount,
      feeAmount: input.feeAmount,
      networkMode: input.networkMode,
    });

    const existing = this.withdrawals.get(key);
    if (existing) {
      return existing;
    }

    const withdrawalRef = `testnet-wd-${stableHash(key)}`;

    const record: WithdrawalRecord = {
      providerWithdrawalRef: withdrawalRef,
      custodyWalletRef: input.custodyWalletRef,
      assetSymbol: input.assetSymbol,
      networkCode: input.networkCode,
      destinationAddress: input.destinationAddress,
      amount: input.amount,
      feeAmount: input.feeAmount,
      networkMode: input.networkMode,
      status: "pending",
    };

    this.withdrawals.set(key, record);
    this.withdrawals.set(withdrawalRef, record);

    return record;
  }

  async getWithdrawalStatus(providerWithdrawalRef: string): Promise<WithdrawalStatusResult> {
    const record = this.withdrawals.get(providerWithdrawalRef);

    if (!record) {
      return {
        providerWithdrawalRef,
        status: "confirmed",
        blockchainTxHash: `testnet-tx-${stableHash(providerWithdrawalRef)}`,
      };
    }

    return {
      providerWithdrawalRef: record.providerWithdrawalRef,
      status: record.status,
      blockchainTxHash: record.blockchainTxHash,
    };
  }
}
