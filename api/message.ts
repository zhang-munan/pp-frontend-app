import { request } from "@/.cool";

const PREFIX = '/app/message/info'

export interface MessageItem {
  id: number
  type: number // 0提醒 1系统
  category: string // water/fertilize/vaccine/deworm/medication/order/system...
  title: string
  content?: string
  image?: string
  bizType?: string
  bizId?: number
  page?: string
  readFlag: number
  createTime: string
  extra?: MessageExtra | null
}

/** 二期商城：提醒消息里的商品推荐卡片，price 单位为分 */
export interface MessageProductCard {
  skuId: number
  merchantId: number
  title: string
  image?: string
  price: number
  page: string
}

export interface MessageExtra {
  productCard?: MessageProductCard
  [key: string]: any
}

export interface MessageSetting {
  enabled: number
  remindTime: string
  water: number
  fertilize: number
  vaccine: number
  deworm: number
  medication: number
  advanceDays: number
}

export interface SubscribeInfo {
  templates: { key: string; id: string }[]
  counts: Record<string, number>
  officialLinked: boolean
  officialEnabled: boolean
}

export interface UnreadCount {
  total: number
  remind: number
  system: number
}

export function messageList(type: number, page = 1, size = 20) {
  return request<{ list: MessageItem[]; pagination: { page: number; size: number; total: number } }>({
    url: `${PREFIX}/messages`,
    data: { type, page, size }
  })
}

export function messageUnread() {
  return request<UnreadCount>({ url: `${PREFIX}/unread`, silent: true })
}

export function readMessages(ids: number[]) {
  return request({ url: `${PREFIX}/read`, method: 'POST', data: { ids }, silent: true })
}

export function readAllMessages(type?: number) {
  return request({ url: `${PREFIX}/readAll`, method: 'POST', data: { type } })
}

export function messageSetting() {
  return request<MessageSetting>({ url: `${PREFIX}/setting` })
}

export function saveMessageSetting(data: Partial<MessageSetting>) {
  return request<MessageSetting>({ url: `${PREFIX}/setting`, method: 'POST', data })
}

export function messageSubscribe() {
  return request<SubscribeInfo>({ url: `${PREFIX}/subscribe`, silent: true })
}

export function reportSubscribe(results: Record<string, string>) {
  return request<Record<string, number>>({
    url: `${PREFIX}/subscribe/report`,
    method: 'POST',
    data: { results },
    silent: true
  })
}

/** 延后提醒，days 天后再提醒或指定日期 */
export function snoozeReminder(bizType: 'plant' | 'pet_health', bizId: number, options: { days?: number; date?: string }) {
  return request<{ untilDate: string }>({
    url: `${PREFIX}/snooze`,
    method: 'POST',
    data: { bizType, bizId, ...options }
  })
}
