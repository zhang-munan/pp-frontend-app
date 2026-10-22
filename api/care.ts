import { request } from "@/.cool";

/** 今日待办聚合 */
export interface TodayResult {
  date: string
  water: any[]    // 待浇水植物
  health: any[]   // 宠物健康提醒
  total: number
}

/** AI 问答结果 */
export interface AskResult {
  limited: boolean
  used: number
  limit: number
  message?: string
  answer?: string
}

/** 今日待办 */
export function today() {
  return request<TodayResult>({
    url: '/app/care/today'
  })
}

/** AI 养护问答 */
export function ask(question: string, imageBase64?: string) {
  return request<AskResult>({
    url: '/app/care/ask',
    method: 'POST',
    data: { question, imageBase64 }
  })
}

/** AI 剩余次数 */
export function aiQuota() {
  return request<{ used: number; limit: number; remaining: number }>({
    url: '/app/care/aiQuota'
  })
}
