/** 数据库与接口金额均以分为单位；仅在展示时换算为元。 */
export function toYuan(amount: number | string | null | undefined): number {
  return Number(amount || 0) / 100
}

export function formatYuan(amount: number | string | null | undefined): string {
  return toYuan(amount).toFixed(2)
}
