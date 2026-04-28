export type MinorUnitString = string
export type FinancialCurrency = 'USDC'

export interface PlayerBalanceDto {
  playerAccountId: string
  currency: FinancialCurrency
  spendableBalanceMinor: MinorUnitString
  lockedBalanceMinor: MinorUnitString
  restrictedBalanceMinor: MinorUnitString
  displayBalanceMinor: MinorUnitString
  asOf: string
}

export interface ReserveStakeRequestDto {
  raceId: string
  selectionId: string
  stakeMinor: MinorUnitString
  currency: FinancialCurrency
}

export interface FundingDepositIntentRequestDto {
  amountMinor: MinorUnitString
  currency: FinancialCurrency
  provider: 'crypto'
  network: string
}
