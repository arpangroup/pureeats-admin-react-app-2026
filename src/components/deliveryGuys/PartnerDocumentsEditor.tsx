import { useRef, useState, type ChangeEvent } from 'react'
import { Camera } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Field, Select, TextInput } from '@/components/ui/FormControls'
import { deliveryGuyService, type DeliveryGuyRow } from '@/services/deliveryGuyService'
import { compressImage } from '@/lib/imageCompress'
import type { DeliveryGuyDetail } from '@/types/entities'

type Draft = {
  licenseNumber: string
  idProofType: 'AADHAAR' | 'PAN'
  idProofNumber: string
  vehicleType: 'BIKE' | 'CYCLE' | 'EV'
  vehicleNumber: string
  payoutMethod: 'BANK' | 'UPI'
  bankAccountHolder: string
  bankAccountNumber: string
  bankIfsc: string
  upiId: string
}

/**
 * Admin correction of a partner's documents and payout details (licence number + photo, Aadhaar/PAN,
 * vehicle, bank/UPI) - for any partner, whatever the Profile editing settings say for the app. The server
 * validates each group like it does at sign-up.
 */
export function PartnerDocumentsEditor({ partner, open, onClose, onSaved }: { partner: DeliveryGuyRow; open: boolean; onClose: () => void; onSaved: (p: DeliveryGuyRow) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState<Draft>(() => ({
    licenseNumber: partner.licenseNumber ?? '',
    idProofType: partner.idProofType ?? 'AADHAAR',
    idProofNumber: partner.idProofNumber ?? '',
    vehicleType: partner.vehicleType ?? 'BIKE',
    vehicleNumber: partner.vehicleNumber ?? '',
    payoutMethod: partner.payoutMethod ?? 'UPI',
    bankAccountHolder: partner.bankAccountHolder ?? '',
    bankAccountNumber: partner.bankAccountNumber ?? '',
    bankIfsc: partner.bankIfsc ?? '',
    upiId: partner.upiId ?? '',
  }))
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(partner.licensePhotoUrl ?? null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }))

  async function pick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const small = await compressImage(file)
      setPhoto(small)
      setPreview(URL.createObjectURL(small))
    } catch (err) {
      setError((err as { message?: string })?.message ?? "Couldn't use this photo.")
    }
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      // Only filled groups are sent - each is validated server-side.
      const payload: Partial<DeliveryGuyDetail> = {
        vehicleNumber: draft.vehicleNumber.trim(),
        ...(draft.licenseNumber.trim() ? { licenseNumber: draft.licenseNumber.trim() } : {}),
        ...(draft.idProofNumber.trim() ? { idProofType: draft.idProofType, idProofNumber: draft.idProofNumber.trim() } : {}),
        vehicleType: draft.vehicleType,
        payoutMethod: draft.payoutMethod,
        ...(draft.payoutMethod === 'UPI'
          ? { upiId: draft.upiId.trim() }
          : { bankAccountHolder: draft.bankAccountHolder.trim(), bankAccountNumber: draft.bankAccountNumber.trim(), bankIfsc: draft.bankIfsc.trim() }),
      }
      let updated = await deliveryGuyService.update(partner.id, payload)
      if (photo) updated = await deliveryGuyService.uploadLicensePhoto(partner.id, photo)
      onSaved(updated)
      onClose()
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Could not save the details.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => !saving && onClose()}
      title="Edit documents & payout"
      size="lg"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Driving licence number">
          <TextInput value={draft.licenseNumber} onChange={(e) => set({ licenseNumber: e.target.value.toUpperCase() })} placeholder="KA0520190001234" />
        </Field>
        <Field label="Licence photo">
          <button type="button" onClick={() => fileRef.current?.click()} className="flex w-full items-center gap-3 rounded-lg border border-dashed border-slate-300 p-2 text-left text-sm dark:border-slate-700">
            {preview ? <img src={preview} alt="Licence" className="h-10 w-14 rounded object-cover" /> : <Camera size={18} className="text-slate-400" />}
            <span className="text-slate-600 dark:text-slate-300">{preview ? 'Replace photo' : 'Upload photo'}</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pick} />
        </Field>
        <Field label="ID proof">
          <Select value={draft.idProofType} onChange={(e) => set({ idProofType: e.target.value as Draft['idProofType'] })}>
            <option value="AADHAAR">Aadhaar</option>
            <option value="PAN">PAN</option>
          </Select>
        </Field>
        <Field label={draft.idProofType === 'PAN' ? 'PAN' : 'Aadhaar number'}>
          <TextInput value={draft.idProofNumber} onChange={(e) => set({ idProofNumber: e.target.value.toUpperCase() })} />
        </Field>
        <Field label="Vehicle type">
          <Select value={draft.vehicleType} onChange={(e) => set({ vehicleType: e.target.value as Draft['vehicleType'] })}>
            <option value="BIKE">Bike</option>
            <option value="CYCLE">Cycle</option>
            <option value="EV">EV</option>
          </Select>
        </Field>
        <Field label="Vehicle number" hint={draft.vehicleType === 'CYCLE' ? 'Not needed for a cycle.' : undefined}>
          <TextInput value={draft.vehicleNumber} onChange={(e) => set({ vehicleNumber: e.target.value.toUpperCase() })} />
        </Field>
        <Field label="Payout">
          <Select value={draft.payoutMethod} onChange={(e) => set({ payoutMethod: e.target.value as Draft['payoutMethod'] })}>
            <option value="UPI">UPI</option>
            <option value="BANK">Bank account</option>
          </Select>
        </Field>
        {draft.payoutMethod === 'UPI' ? (
          <Field label="UPI ID">
            <TextInput value={draft.upiId} onChange={(e) => set({ upiId: e.target.value.trim() })} placeholder="name@okhdfcbank" />
          </Field>
        ) : (
          <>
            <Field label="Account holder">
              <TextInput value={draft.bankAccountHolder} onChange={(e) => set({ bankAccountHolder: e.target.value })} />
            </Field>
            <Field label="Account number">
              <TextInput value={draft.bankAccountNumber} onChange={(e) => set({ bankAccountNumber: e.target.value.replace(/\D/g, '') })} />
            </Field>
            <Field label="IFSC">
              <TextInput value={draft.bankIfsc} onChange={(e) => set({ bankIfsc: e.target.value.toUpperCase().slice(0, 11) })} />
            </Field>
          </>
        )}
      </div>
      {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{error}</p>}
    </Modal>
  )
}
