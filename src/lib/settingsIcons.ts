import {
  BarChart3,
  Bell,
  Bike,
  Code2,
  CreditCard,
  KeyRound,
  Mail,
  MapPin,
  MessageSquare,
  Monitor,
  Percent,
  Settings as SettingsIcon,
  Smartphone,
  Sparkles,
  Store,
  Timer,
  UserCheck,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

/** Maps the icon *names* the backend's schema sends (see SettingSchemaService on the backend — plain strings, since Java has no business knowing about a frontend icon library) to the actual Lucide components used to render them. Add an entry here whenever a new section/group on the backend names an icon this map doesn't have yet — an unknown name still renders (falls back to a generic gear icon) rather than crashing. */
const ICON_MAP: Record<string, LucideIcon> = {
  BarChart3,
  Bell,
  Bike,
  Code2,
  CreditCard,
  KeyRound,
  Mail,
  MapPin,
  MessageSquare,
  Monitor,
  Percent,
  Settings: SettingsIcon,
  Smartphone,
  Sparkles,
  Store,
  Timer,
  UserCheck,
  Wallet,
}

export function resolveSettingIcon(name: string | null | undefined): LucideIcon {
  return (name && ICON_MAP[name]) || SettingsIcon
}
