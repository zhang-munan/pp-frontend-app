import { request } from "@/.cool";

const PREFIX = '/app/pet/info'
const HEALTH = '/app/pet/health'

/** 宠物档案 */
export interface PetInfo {
  id: number
  name: string
  species: number  // 0猫 1狗 2兔 3仓鼠 4鸟 5鱼 6爬宠 7其他
  breed?: string
  avatar?: string
  gender: number
  birthday?: string
  arriveDate?: string
  neutered: number
  description?: string
  status: number  // 0在养 1已离世 2已送养
}

/** 健康记录 */
export interface PetHealth {
  id: number
  petId: number
  type: number  // 0疫苗 1驱虫 2体重 3用药 4就医 5日常
  itemName: string
  subType?: string
  occurDate: string
  occurTime?: string
  value?: number
  unit?: string
  cycleDays: number
  nextDate?: string
  closed?: number
  doseTimes?: string
  endDate?: string
  dosage?: string
  hospital?: string
  diagnosis?: string
  cost?: number | string
  remind?: number
  remark?: string
  attachments?: string
  /** 后端解析好的照片 */
  photos?: string[]
  /** 后端解析好的用药时间 */
  times?: string[]
  createTime?: string
}

export interface HealthPresets {
  vaccine: { name: string; cycleDays: number }[]
  deworm: { name: string; subType: string; cycleDays: number; unit: string }[]
  dewormBrands: string[]
  daily: string[]
  medicationFrequencies: { name: string; times: string[] }[]
}

export interface WeightRange {
  weight: number | null
  range: { min: number; max: number; label: string } | null
  status: 'low' | 'normal' | 'high' | null
  tip: string
}

export interface WeightAnalysis {
  enough: boolean
  trend?: 'up' | 'down' | 'stable'
  slopePerWeek?: number
  change30?: number
  predicted?: number
  report: string[]
}

export interface DosePlan extends PetHealth {
  totalDays: number
  day: number
  doses: { time: string; taken: boolean; takenAt: string | null }[]
}

export interface MedicationDay {
  date: string
  active: DosePlan[]
  upcoming: (PetHealth & { totalDays: number })[]
  history: (PetHealth & { totalDays: number })[]
}

export interface VaccineBookRow {
  itemName: string
  subType?: string
  occurDate: string
  nextDate?: string
  hospital?: string
  dosage?: string
}

export interface VaccineBook {
  pet: { name: string; species: string; breed?: string; gender: string; birthday?: string; neutered: boolean; avatar?: string }
  vaccines: VaccineBookRow[]
  deworms: VaccineBookRow[]
  upcoming: VaccineBookRow[]
  generatedAt: string
}

export const SPECIES_NAMES = ['猫', '狗', '兔', '仓鼠', '鸟', '鱼', '爬宠', '其他']
export const HEALTH_TYPE_NAMES = ['疫苗', '驱虫', '体重', '用药', '就医', '日常']
export const PET_STATUS_NAMES = ['在养', '已离世', '已送养']

/** 我的宠物列表 */
export function myPets() {
  return request<PetInfo[]>({
    url: `${PREFIX}/mine`
  })
}

/** 新增宠物 */
export function addPet(data: Partial<PetInfo>) {
  return request({
    url: `${PREFIX}/add`,
    method: 'POST',
    data
  })
}

/** 更新宠物 */
export function updatePet(data: Partial<PetInfo>) {
  return request({
    url: `${PREFIX}/update`,
    method: 'POST',
    data
  })
}

/** 修改宠物状态（在养/已离世/已送养） */
export function setPetStatus(id: number, status: number) {
  return request({
    url: `${PREFIX}/status`,
    method: 'POST',
    data: { id, status }
  })
}

/** 删除宠物（含全部健康记录） */
export function deletePet(id: number) {
  return request({
    url: `${PREFIX}/remove`,
    method: 'POST',
    data: { id }
  })
}

/** 宠物年龄换算 */
export function petAge(petId: number) {
  return request<{ text: string; humanAge: number }>({
    url: `${PREFIX}/age`,
    data: { petId }
  })
}

/** 表单预设（按物种） */
export function healthPresets(species: number) {
  return request<HealthPresets>({
    url: `${HEALTH}/presets`,
    data: { species },
    silent: true
  })
}

/** 新增健康记录 */
export function addHealthRecord(data: Partial<PetHealth> & Record<string, any>) {
  return request<PetHealth>({
    url: `${HEALTH}/addRecord`,
    method: 'POST',
    data
  })
}

/** 修改健康记录 */
export function updateHealthRecord(data: Partial<PetHealth> & Record<string, any>) {
  return request<PetHealth>({
    url: `${HEALTH}/updateRecord`,
    method: 'POST',
    data
  })
}

/** 删除健康记录 */
export function removeHealthRecord(id: number) {
  return request({
    url: `${HEALTH}/removeRecord`,
    method: 'POST',
    data: { id }
  })
}

/** 健康记录详情 */
export function healthDetail(id: number) {
  return request<PetHealth>({
    url: `${HEALTH}/detail`,
    data: { id }
  })
}

/** 按宠物查健康记录 */
export function healthList(petId: number, type?: number) {
  return request<PetHealth[]>({
    url: `${HEALTH}/listByPet`,
    data: { petId, type }
  })
}

/** 体重曲线 */
export function weightCurve(petId: number) {
  return request<{ date: string; value: number }[]>({
    url: `${HEALTH}/weightCurve`,
    data: { petId }
  })
}

/** 体重参考区间与偏离提示 */
export function weightRange(petId: number) {
  return request<WeightRange>({
    url: `${HEALTH}/weightRange`,
    data: { petId },
    silent: true
  })
}

/** 体重趋势分析（Plus，非会员会弹出开通引导） */
export function weightAnalysis(petId: number) {
  return request<WeightAnalysis>({
    url: `${HEALTH}/weightAnalysis`,
    data: { petId }
  })
}

/** 健康提醒（疫苗/驱虫到期） */
export function healthReminders(days = 7) {
  return request<any[]>({
    url: `${HEALTH}/reminders`,
    data: { days }
  })
}

/** 完成循环提醒打卡 */
export function doneCycle(id: number, occurDate?: string) {
  return request({
    url: `${HEALTH}/doneCycle`,
    method: 'POST',
    data: { id, occurDate }
  })
}

/** 日常一键打卡 */
export function checkin(data: { petId: number; itemName: string; occurDate?: string; occurTime?: string; photos?: string[]; remark?: string }) {
  return request<PetHealth>({
    url: `${HEALTH}/checkin`,
    method: 'POST',
    data
  })
}

/** 今日已打卡 */
export function todayCheckin(petId?: number) {
  return request<PetHealth[]>({
    url: `${HEALTH}/todayCheckin`,
    data: { petId },
    silent: true
  })
}

/** 某天的用药计划 */
export function medications(petId: number, date?: string) {
  return request<MedicationDay>({
    url: `${HEALTH}/medications`,
    data: { petId, date }
  })
}

/** 标记一顿已服用/取消 */
export function takeDose(id: number, time: string, taken: boolean, date?: string) {
  return request<{ taken: boolean; takenAt: string | null }>({
    url: `${HEALTH}/dose`,
    method: 'POST',
    data: { id, time, taken, date }
  })
}

/** 疫苗本导出数据（Plus） */
export function vaccineBook(petId: number) {
  return request<VaccineBook>({
    url: `${HEALTH}/vaccineBook`,
    data: { petId }
  })
}
