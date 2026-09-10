import { AlertTriangle, type LucideIcon } from 'lucide-react'
import { SectionCard } from '@/components/ui/SectionCard'
import { EmptyState } from '@/components/ui/Feedback'

export function SettingsLoadError({ title, icon = AlertTriangle, error, onRetry }: { title: string; icon?: LucideIcon; error: string | null; onRetry: () => void }) {
  return (
    <SectionCard title={title} icon={icon}>
      <EmptyState
        icon={<AlertTriangle size={22} />}
        title="Couldn't load these settings"
        description={error ?? 'Something went wrong loading the current configuration.'}
        action={
          <button className="btn-secondary" onClick={onRetry}>
            Try again
          </button>
        }
      />
    </SectionCard>
  )
}
