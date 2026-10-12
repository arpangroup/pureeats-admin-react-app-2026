/** A delivery partner's uploaded document (see the backend's RiderDocuments). */
export type PartnerDocType = 'LICENSE' | 'AADHAAR_FRONT' | 'AADHAAR_BACK' | 'PAN' | 'RC' | 'PASSBOOK'

export const DOC_LABELS: Record<PartnerDocType | 'PHOTO', string> = {
  LICENSE: 'Driving licence',
  AADHAAR_FRONT: 'Aadhaar (front)',
  AADHAAR_BACK: 'Aadhaar (back)',
  PAN: 'PAN card',
  RC: 'Vehicle RC',
  PASSBOOK: 'Bank passbook / cheque',
  PHOTO: 'Partner photo',
}

/** Same rule as the server: licence, Aadhaar front + back and PAN always; RC unless a cycle; passbook for a bank payout. */
export function requiredDocuments(vehicleType: 'BIKE' | 'CYCLE' | 'EV', payoutMethod: 'BANK' | 'UPI'): PartnerDocType[] {
  const docs: PartnerDocType[] = ['LICENSE', 'AADHAAR_FRONT', 'AADHAAR_BACK', 'PAN']
  if (vehicleType !== 'CYCLE') docs.push('RC')
  if (payoutMethod === 'BANK') docs.push('PASSBOOK')
  return docs
}
