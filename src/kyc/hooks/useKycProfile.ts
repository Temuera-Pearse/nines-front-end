import { usePlayerAccount } from '../../player/PlayerAccountProvider'

export function useKycProfile() {
  const { kyc, kycUiEnabled, refreshKyc } = usePlayerAccount()
  return { ...kyc, isEnabled: kycUiEnabled, refresh: refreshKyc }
}
