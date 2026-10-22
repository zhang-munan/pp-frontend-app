import { request } from "@/.cool";

const PREFIX = '/app/plant/info'
const CARE = '/app/plant/care'

/** 植物档案 */
export interface PlantInfo {
  id: number
  name: string
  speciesName?: string
  avatar?: string
  location: number // 0客厅 1阳台 2卧室 3书房 4办公桌 5厨房 6户外 7其他
  arriveDate?: string
  waterCycleDays: number
  lastWaterDate?: string
  nextWaterDate?: string
  fertilizeCycleDays: number
  lastFertilizeDate?: string
  nextFertilizeDate?: string
  speciesId?: number
  autoSeason?: number // 1 按季节自动调整浇水周期
  status: number // 0正常 1已枯萎 2已送人
  description?: string
}

/** 养护记录 */
export interface PlantCare {
  id: number
  plantId: number
  type: number // 0浇水 1施肥 2换盆 3拍照 4其他 5晒太阳
  occurDate: string
  photo?: string
  height?: number
  milestone?: string
  remark?: string
}

/** 品种库条目 */
export interface PlantSpecies {
  id: number
  name: string
  alias?: string
  waterCycleDays: number
  fertilizeCycleDays?: number
  light: number
  difficulty: number
  tips?: string
}

export interface CalendarPlan {
  date: string
  type: number // 0浇水 1施肥
  overdueDays: number
  plantId: number
  plantName: string
  speciesName?: string
  avatar?: string
}

export interface CareCalendar {
  month: string
  today: string
  days: Record<string, { done: number[]; todo: number[] }>
  records: (PlantCare & { plantName: string; speciesName?: string; avatar?: string })[]
  plans: CalendarPlan[]
}

export interface PlantGrowth {
  plant: { id: number; name: string; speciesName?: string; avatar?: string; arriveDate?: string }
  days: number
  newLeaves: number
  heightChange: number | null
  summary: string
  photos: PlantCare[]
  records: PlantCare[]
}

export interface GuideSection {
  section: number
  sectionName: string
  title: string
  content: string
  source: number // 0人工 1AI
}

export interface SpeciesGuide {
  species: (PlantSpecies & { scientificName?: string; lightName?: string; seasonAdjust?: { summer?: number; winter?: number } | null }) | null
  sections: GuideSection[]
  aiReviewed: boolean
}

export interface PlantDisease {
  id: number
  name: string
  symptom: string
  causes?: string
  steps: { title: string; content: string }[]
  image?: string
}

export const LOCATION_NAMES = ['客厅', '阳台', '卧室', '书房', '办公桌', '厨房', '户外', '其他']
export const CARE_TYPE_NAMES = ['浇水', '施肥', '换盆', '拍照', '其他', '晒太阳']
export const PLANT_STATUS_NAMES = ['正常', '已枯萎', '已送人']
export const MILESTONES = ['新叶', '开花', '长高', '换盆', '结果']
export const LIGHT_NAMES = ['耐阴', '半阴', '散射光', '喜阳']
export const DIFFICULTY_NAMES = ['新手友好', '一般', '进阶']

/** 我的植物列表 */
export function myPlants() {
  return request<PlantInfo[]>({
    url: `${PREFIX}/mine`
  })
}

/** 添加植物 */
export function addPlant(data: Partial<PlantInfo>) {
  return request({
    url: `${PREFIX}/addPlant`,
    method: 'POST',
    data
  })
}

/** 更新植物 */
export function updatePlant(data: Partial<PlantInfo>) {
  return request({
    url: `${PREFIX}/update`,
    method: 'POST',
    data
  })
}

/** 删除植物（含全部养护记录） */
export function deletePlant(id: number) {
  return request({
    url: `${PREFIX}/remove`,
    method: 'POST',
    data: { id }
  })
}

/** 浇水打卡 */
export function water(plantId: number, date?: string) {
  return request<{ nextWaterDate: string }>({
    url: `${CARE}/water`,
    method: 'POST',
    data: { plantId, date }
  })
}

/** 修改状态：0正常 1已枯萎 2已送人 */
export function setPlantStatus(id: number, status: number) {
  return request<PlantInfo>({
    url: `${PREFIX}/status`,
    method: 'POST',
    data: { id, status }
  })
}

/** 添加养护记录：1施肥 2换盆 3拍照 4其他 5晒太阳 */
export function addCare(data: {
  plantId: number
  type: number
  occurDate?: string
  photo?: string
  height?: number
  milestone?: string
  remark?: string
}) {
  return request<PlantCare>({
    url: `${CARE}/add`,
    method: 'POST',
    data
  })
}

/** 删除一条养护记录（浇水/施肥会重算计划） */
export function removeCare(id: number) {
  return request({
    url: `${CARE}/remove`,
    method: 'POST',
    data: { id }
  })
}

/** 养护月历 */
export function careCalendar(month: string, plantId?: number) {
  return request<CareCalendar>({
    url: `${CARE}/calendar`,
    data: plantId ? { month, plantId } : { month }
  })
}

/** 生长记录 */
export function plantGrowth(plantId: number) {
  return request<PlantGrowth>({
    url: `${CARE}/growth`,
    data: { plantId }
  })
}

/** 品种养护攻略（免登录） */
export function speciesGuide(id?: number, name?: string) {
  return request<SpeciesGuide>({
    url: `/app/plant/guide/species`,
    data: { id, name }
  })
}

/** 病害急救（免登录） */
export function plantDiseases() {
  return request<PlantDisease[]>({
    url: `/app/plant/guide/diseases`
  })
}

/** 撤销今日浇水 */
export function undoWater(plantId: number) {
  return request({
    url: `${CARE}/undoWater`,
    method: 'POST',
    data: { plantId }
  })
}

/** 待浇水列表 */
export function waterReminders() {
  return request<any[]>({
    url: `${CARE}/waterReminders`
  })
}

/** 养护时间线 */
export function careTimeline(plantId: number) {
  return request<PlantCare[]>({
    url: `${CARE}/timeline`,
    data: { plantId }
  })
}

/** 品种搜索（免登录） */
export function searchSpecies(keyword: string) {
  return request<PlantSpecies[]>({
    url: `/app/plant/species/search`,
    data: { keyword }
  })
}
