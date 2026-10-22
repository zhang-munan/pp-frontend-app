import { request } from "@/.cool";

/** 今日待办聚合 */
export interface TodayResult {
  date: string
  water: any[]    // 待浇水植物
  fertilize?: { id: number; name: string; speciesName?: string; avatar?: string; nextFertilizeDate: string; overdueDays: number }[]
  health: any[]   // 宠物健康提醒
  medication?: DoseTodo[]
  checkin?: { petId: number; petName: string; petAvatar?: string; species: number }[]
  total: number
}

export interface DoseTodo {
  healthId: number
  petId: number
  petName: string
  petAvatar?: string
  itemName: string
  dosage?: string
  time: string
  taken: boolean
}

export interface CareStats {
  companionDays: number
  petCount: number
  plantCount: number
  totalPets: number
  totalPlants: number
  recordCount: number
  checkinCount: number
  aiCount: number
}

export interface Badge {
  key: string
  name: string
  desc: string
  target: number
  progress: number
  earned: boolean
}

export interface AnnualReport {
  year: number
  isPlus: boolean
  full: boolean
  range: { start: string; end: string }
  companionDays: number
  petCount: number
  plantCount: number
  companions: string
  water: number
  deworm: number
  vaccine: number
  covers: { kind: string; id: number; name: string; avatar?: string }[]
  fertilize?: number
  repot?: number
  visit?: number
  medication?: number
  checkin?: number
  records?: number
  photoCount?: number
  photos?: { url: string; date: string; kind: string; id: number }[]
  months?: number[]
  busiestMonth?: number | null
  firstRecordDate?: string | null
  weights?: { petId: number; name: string; from: number; to: number; points: { date: string; value: number }[] }[]
  badges?: Badge[]
}

/** 年度报告；免费用户返回基础版 */
export function annualReport(year?: number) {
  return request<AnnualReport>({ url: '/app/care/annualReport', data: year ? { year } : {} })
}

/** 徽章进度 */
export function badges() {
  return request<{ isPlus: boolean; earned: number; list: Badge[] }>({ url: '/app/care/badges' })
}

/** 导出 xlsx，返回文件地址 */
export function exportData(data: { scope: string; range: string; contents: string[] }) {
  return request<{ url: string; fileName: string; counts: Record<string, number> }>({
    url: '/app/care/export',
    method: 'POST',
    data,
    timeout: 120000
  })
}

/** 删除我的全部档案与记录（账号保留） */
export function purgeData() {
  return request({
    url: '/app/care/purge',
    method: 'POST'
  })
}

/** 我的页统计 */
export function stats() {
  return request<CareStats>({
    url: '/app/care/stats',
    silent: true
  })
}

/** 今日待办 */
export function today() {
  return request<TodayResult>({
    url: '/app/care/today'
  })
}

export interface TimelineItem {
  id: number
  petId: number
  type: number
  title: string
  desc: string
  date: string
  time: string
  value: number | null
  cost: number | null
  photos: string[]
  highlight: boolean
}

export interface Memory {
  date: string
  petId: number
  petName: string
  cover: string | null
  title: string
  desc: string
  items: TimelineItem[]
}

/** 宠物统一时间线；kind: all | health | daily | photo */
export function timeline(petId: number, kind = 'all', page = 1, size = 20) {
  return request<{ list: TimelineItem[]; pagination: { page: number; size: number; total: number } }>({
    url: '/app/care/timeline',
    data: { petId, kind, page, size }
  })
}

/** 一年前的今天 */
export function memories(petId?: number) {
  return request<Memory | null>({
    url: '/app/care/memories',
    data: { petId },
    silent: true
  })
}