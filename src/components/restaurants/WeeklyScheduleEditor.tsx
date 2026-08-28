import { Copy, Plus, X } from 'lucide-react'
import { Switch, TextInput } from '@/components/ui/FormControls'
import { classNames } from '@/lib/format'
import type { DayOfWeek, DaySchedule, TimeSlot } from '@/types/entities'

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}

const DAY_ORDER: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export function WeeklyScheduleEditor({ value, onChange }: { value: DaySchedule[]; onChange: (schedule: DaySchedule[]) => void }) {
  const byDay = new Map(value.map((d) => [d.day, d]))
  const schedule = DAY_ORDER.map((day) => byDay.get(day) ?? { day, isOpen: false, slots: [] })

  function updateDay(day: DayOfWeek, updater: (d: DaySchedule) => DaySchedule) {
    onChange(schedule.map((d) => (d.day === day ? updater(d) : d)))
  }

  function toggleOpen(day: DayOfWeek, isOpen: boolean) {
    updateDay(day, (d) => ({
      ...d,
      isOpen,
      slots: isOpen && d.slots.length === 0 ? [{ open: '09:00', close: '22:00' }] : d.slots,
    }))
  }

  function addSlot(day: DayOfWeek) {
    updateDay(day, (d) => ({ ...d, slots: [...d.slots, { open: '09:00', close: '22:00' }] }))
  }

  function removeSlot(day: DayOfWeek, index: number) {
    updateDay(day, (d) => ({ ...d, slots: d.slots.filter((_, i) => i !== index) }))
  }

  function updateSlot(day: DayOfWeek, index: number, patch: Partial<TimeSlot>) {
    updateDay(day, (d) => ({ ...d, slots: d.slots.map((s, i) => (i === index ? { ...s, ...patch } : s)) }))
  }

  function applyToAllDays(day: DayOfWeek) {
    const source = schedule.find((d) => d.day === day)
    if (!source) return
    onChange(schedule.map((d) => ({ ...d, isOpen: source.isOpen, slots: source.slots.map((s) => ({ ...s })) })))
  }

  return (
    <div className="space-y-2">
      {schedule.map((day) => (
        <div
          key={day.day}
          className={classNames(
            'rounded-lg border px-3 py-2.5 sm:flex sm:items-start sm:gap-4',
            day.isOpen
              ? 'border-slate-200 dark:border-slate-800'
              : 'border-slate-100 bg-slate-50/60 dark:border-slate-800/60 dark:bg-slate-900/40',
          )}
        >
          <div className="flex items-center justify-between gap-3 sm:w-36 sm:shrink-0 sm:justify-start">
            <Switch checked={day.isOpen} onChange={(v) => toggleOpen(day.day, v)} label={DAY_LABELS[day.day]} />
          </div>

          {day.isOpen ? (
            <div className="mt-2.5 flex-1 space-y-2 sm:mt-0">
              {day.slots.map((slot, index) => (
                <div key={index} className="flex items-center gap-2">
                  <TextInput
                    type="time"
                    value={slot.open}
                    onChange={(e) => updateSlot(day.day, index, { open: e.target.value })}
                    className="w-32"
                  />
                  <span className="text-xs text-slate-400 dark:text-slate-500">to</span>
                  <TextInput
                    type="time"
                    value={slot.close}
                    onChange={(e) => updateSlot(day.day, index, { close: e.target.value })}
                    className="w-32"
                  />
                  {day.slots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSlot(day.day, index)}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                      aria-label="Remove time slot"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              <div className="flex items-center gap-3 pt-0.5">
                <button
                  type="button"
                  onClick={() => addSlot(day.day)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                >
                  <Plus size={12} /> Add another time slot
                </button>
                <button
                  type="button"
                  onClick={() => applyToAllDays(day.day)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                  title="Copy this day's hours to every day of the week"
                >
                  <Copy size={12} /> Apply to all days
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-400 dark:text-slate-500 sm:mt-0.5">Closed</p>
          )}
        </div>
      ))}
    </div>
  )
}
