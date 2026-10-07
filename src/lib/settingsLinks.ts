/**
 * Deep links into the Settings page: /admin/settings/{category}#{section}. Each settings section
 * card gets an id of `settingsSlug(its title)` (see SectionCard's `anchorId`), so a link can open
 * the right tab AND scroll straight to the section - e.g. from an order's pricing breakdown to
 * General → Commerce.
 */
export function settingsSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function settingsSectionPath(category: string, sectionTitle: string): string {
  return `/admin/settings/${category}#${settingsSlug(sectionTitle)}`
}

/** Sections other pages link to. Titles must match the backend's SettingSchemaService group titles. */
export const SETTINGS_LINKS = {
  commerce: settingsSectionPath('general', 'Commerce'),
  platformFee: settingsSectionPath('general', 'Platform fee'),
  /** Default delivery partner commission (%). */
  riderEarnings: settingsSectionPath('delivery-app', 'Earnings'),
} as const
