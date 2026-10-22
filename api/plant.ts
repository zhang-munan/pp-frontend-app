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
  status: number
  description?: string
}

/** 养护记录 */
export interface PlantCare {
  id: number
  plantId: number
  type: number // 0浇水 1施肥 2换盆 3拍照 4其他
  occurDate: string
  photo?: string
  remark?: string
}

/** 品种库条目 */
export interface PlantSpecies {
  id: number
  name: string
  alias?: string
  waterCycleDays: number
  light: number
  difficulty: number
  tips?: string
}

export const LOCATION_NAMES = ['客厅', '阳台', '卧室', '书房', '办公桌', '厨房', '户外', '其他']
export const CARE_TYPE_NAMES = ['浇水', '施肥', '换盆', '拍照', '其他']

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

/** 删除植物 */
export function deletePlant(id: number) {
  return request({
    url: `${PREFIX}/delete`,
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
