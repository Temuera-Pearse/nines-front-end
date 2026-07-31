import { usePlayerAccount } from '../../player/PlayerAccountProvider'

export function useStartKycSession() {
  const {
    isStartingKyc,
    lastStartedSession,
    kycPopupStatus,
    kycPopupError,
    openKycSession,
    startKycError,
    startOrResumeKyc,
  } = usePlayerAccount()
  return {
    isLoading: isStartingKyc,
    data: lastStartedSession,
    error: startKycError,
    popupStatus: kycPopupStatus,
    popupError: kycPopupError,
    startOrResume: startOrResumeKyc,
    openSession: openKycSession,
  }
}
