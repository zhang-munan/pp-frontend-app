/** 数据库与接口金额均以分为单位；仅在展示时换算为元。 */
export function toYuan(amount: number | string | null | undefined): number {
  return Number(amount || 0) / 100
}

export function formatYuan(amount: number | string | null | undefined): string {
  return toYuan(amount).toFixed(2)
}

/** 整元不带小数，例如 1500 → "15"，1550 → "15.50" */
export function shortYuan(amount: number | string | null | undefined): string {
  const cents = Number(amount || 0)
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2)
}
