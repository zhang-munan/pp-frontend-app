import { request } from "@/.cool";

const PREFIX = '/app/feedback/info'

export const FEEDBACK_TYPES = ['功能建议', '遇到问题', '投诉举报', '其他']
export const FEEDBACK_STATUS = ['待处理', '已回复', '已关闭']

export interface FeedbackInfo {
  id: number
  type: number
  content: string
  images?: string[]
  contact?: string
  status: number
  reply?: string
  replyTime?: string
  createTime: string
}

export function submitFeedback(data: { type: number; content: string; images?: string[]; contact?: string }) {
  return request({
    url: `${PREFIX}/submit`,
    method: 'POST',
    data
  })
}

export function myFeedback() {
  return request<FeedbackInfo[]>({
    url: `${PREFIX}/myList`
  })
}
