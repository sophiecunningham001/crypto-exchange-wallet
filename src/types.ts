export type NetworkMode = "testnet" | "mainnet";
export type ChainType = "bitcoin" | "ethereum" | "solana" | "polygon" | string;

export interface WalletInput {
  walletPublicId: string;
  userPublicId: string;
  networkMode: NetworkMode;
}

export interface WalletRecord {
  custodyWalletRef: string;
  walletPublicId: string;
  userPublicId: string;
  networkMode: NetworkMode;
}

export interface DepositAddressInput {
  custodyWalletRef: string;
  walletPublicId: string;
  assetSymbol: string;
  networkCode: string;
  chainType: ChainType;
  networkMode: NetworkMode;
}

export interface DepositAddressRecord {
  custodyWalletRef: string;
  walletPublicId: string;
  assetSymbol: string;
  networkCode: string;
  chainType: ChainType;
  networkMode: NetworkMode;
  address: string;
}

export interface WalletAssetBalance {
  walletPublicId: string;
  assetSymbol: string;
  networkCode: string;
  available: string;
  pending: string;
  total: string;
}

export interface BalanceMutationInput {
  walletPublicId: string;
  assetSymbol: string;
  networkCode: string;
  amount: string;
}

export interface WithdrawalSubmissionInput {
  idempotencyKey: string;
  custodyWalletRef: string;
  assetSymbol: string;
  networkCode: string;
  destinationAddress: string;
  amount: string;
  feeAmount: string;
  networkMode: NetworkMode;
}

export interface WithdrawalRecord {
  providerWithdrawalRef: string;
  custodyWalletRef: string;
  assetSymbol: string;
  networkCode: string;
  destinationAddress: string;
  amount: string;
  feeAmount: string;
  networkMode: NetworkMode;
  status: "pending" | "confirmed";
  blockchainTxHash?: string;
}

export interface WithdrawalStatusResult {
  providerWithdrawalRef: string;
  status: "pending" | "confirmed";
  blockchainTxHash?: string;
}
