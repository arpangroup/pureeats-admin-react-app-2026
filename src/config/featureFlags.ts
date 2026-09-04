/**
 * Local, frontend-only feature flags — no backend/admin config involved. Flip the constant
 * below (or override per-environment via the matching VITE_ env var) and rebuild.
 */
export const FEATURE_FLAGS = {
  /** Require typing the order's last 4 ID characters before an order-status change takes effect. */
  orderStatusChangeConfirmation: (import.meta.env.VITE_FEATURE_ORDER_STATUS_CONFIRMATION ?? 'true') !== 'false',
}
