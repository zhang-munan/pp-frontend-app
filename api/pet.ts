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
  status: number
}

/** 健康记录 */
export interface PetHealth {
  id: number
  petId: number
  type: number  // 0疫苗 1驱虫 2体重 3用药 4就医 5日常
  itemName: string
  subType?: string
  occurDate: string
  value?: number
  unit?: string
  cycleDays: number
  nextDate?: string
  remark?: string
}

export const SPECIES_NAMES = ['猫', '狗', '兔', '仓鼠', '鸟', '鱼', '爬宠', '其他']
export const HEALTH_TYPE_NAMES = ['疫苗', '驱虫', '体重', '用药', '就医', '日常']

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

/** 删除宠物 */
export function deletePet(id: number) {
  return request({
    url: `${PREFIX}/delete`,
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

/** 新增健康记录 */
export function addHealthRecord(data: Partial<PetHealth>) {
  return request({
    url: `${HEALTH}/addRecord`,
    method: 'POST',
    data
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
