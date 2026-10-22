import { request } from "@/.cool";

const PREFIX = '/app/ai/assistant'

/** 0直接提问 1宠物问诊 2植物诊断 3品种识别 */
export const AI_MODES = ['chat', 'consult', 'diagnose', 'identify']
export const AI_MODE_NAMES = ['直接提问', '宠物问诊', '植物诊断', '品种识别']

export interface AiQuotaItem {
  used: number
  limit: number | null // Plus 为 null
  remaining: number | null
}

export interface AiQuota {
  isPlus: boolean
  ask: AiQuotaItem
  identify: AiQuotaItem
}

export interface AiAnalysis {
  title: string
  summary: string
  urgency: number // 0可先观察 1尽快处理 2立即就医
  causes: { title: string; content: string; icon: string }[]
  observe: { title: string; content: string }[]
  steps: { title: string; content: string }[]
}

export interface AiSpecies {
  id: number
  name: string
  alias?: string
  scientificName?: string
  waterCycleDays: number
  fertilizeCycleDays: number
  light: number
  difficulty: number
  tips?: string
}

export interface AiIdentify {
  kind: 'plant' | 'pet' | 'unknown'
  name: string
  confidence: number
  confident: boolean
  description: string
  tips: string
  candidates: { name: string; reason: string }[]
  species: AiSpecies | null
  petSpecies: number | null
}

export interface AiMessage {
  id: number
  role: number // 0用户 1助手
  content: string
  image?: string
  structured: AiAnalysis | AiIdentify | null
  createTime?: string
}

export interface AiConversation {
  id: number
  mode: number
  kind: number // 0综合 1宠物 2植物
  targetType: number
  targetId?: number
  title: string
  cover?: string
  summary?: string
  messageCount: number
  lastTime: string
}

export interface AiTarget {
  type: number
  id: number
  name: string
  avatar?: string
  sub?: string
}

export interface AskAiResult {
  conversationId: number
  mode: number
  message: AiMessage
  disclaimer: string
  quota: AiQuota
}

/** 提问：不带 conversationId 时新建会话；额度用完时 reject { code: 2001 } */
export function askAi(data: {
  conversationId?: number
  mode?: string
  question?: string
  image?: string
  targetType?: number
  targetId?: number
}) {
  return request<AskAiResult>({
    url: `${PREFIX}/ask`,
    method: 'POST',
    data,
    timeout: 90000,
    silent: true
  })
}

export function aiQuota() {
  return request<AiQuota>({
    url: `${PREFIX}/quota`,
    silent: true
  })
}

export function aiConversations(kind = 0, keyword = '', page = 1, size = 20) {
  return request<{ list: AiConversation[]; pagination: { page: number; size: number; total: number } }>({
    url: `${PREFIX}/conversations`,
    data: { kind, keyword, page, size }
  })
}

export function aiDetail(id: number) {
  return request<{ conversation: AiConversation; target: AiTarget | null; disclaimer: string; messages: AiMessage[] }>({
    url: `${PREFIX}/detail`,
    data: { id }
  })
}

export function removeAiConversations(ids: number[]) {
  return request<number>({
    url: `${PREFIX}/remove`,
    method: 'POST',
    data: { ids }
  })
}
