import { request } from "@/.cool";

const PREFIX = '/app/family/info'

export interface FamilyUser {
  userId: number
  nickName: string
  avatarUrl?: string
}

export interface FamilyPet {
  id: number
  name: string
  avatar?: string
  species: number
  breed?: string
  birthday?: string
  status: number
  shared: number
}

export interface FamilyPlant {
  id: number
  name: string
  avatar?: string
  speciesName?: string
  nextWaterDate?: string
  status: number
  shared: number
}

export interface FamilyOverview {
  owner: FamilyUser
  members: (FamilyUser & { id: number; joinTime: string })[]
  pending: { id: number; code: string; expireTime: string }[]
  pets: FamilyPet[]
  plants: FamilyPlant[]
  joined: (FamilyUser & { ownerId: number; petCount: number; plantCount: number; joinTime: string })[]
}

export interface FamilyInvitation {
  state: 'ok' | 'self' | 'joined' | 'used' | 'expired'
  ownerId: number
  owner: FamilyUser
  expireTime: string
  pets: FamilyPet[]
  plants: FamilyPlant[]
}

export interface FamilyView {
  owner: FamilyUser
  readonly: boolean
  today: string
  pets: FamilyPet[]
  plants: FamilyPlant[]
  done: { kind: string; id: number; targetId: number; title: string; time: string; remark: string }[]
  upcoming: { kind: string; targetId: number; title: string; date: string; daysLeft: number }[]
}

export function familyOverview() {
  return request<FamilyOverview>({ url: `${PREFIX}/overview` })
}

export function familyShare(petIds: number[], plantIds: number[]) {
  return request<{ pets: number; plants: number }>({
    url: `${PREFIX}/share`,
    method: 'POST',
    data: { petIds, plantIds }
  })
}

export function familyInvite(petIds: number[], plantIds: number[]) {
  return request<{ id: number; code: string; expireTime: string; pets: number; plants: number }>({
    url: `${PREFIX}/invite`,
    method: 'POST',
    data: { petIds, plantIds }
  })
}

export function familyInvitation(code: string) {
  return request<FamilyInvitation>({ url: `${PREFIX}/invitation`, data: { code } })
}

export function familyAccept(code: string) {
  return request<{ ownerId: number }>({
    url: `${PREFIX}/accept`,
    method: 'POST',
    data: { code }
  })
}

export function familyRemoveMember(id: number) {
  return request({ url: `${PREFIX}/removeMember`, method: 'POST', data: { id } })
}

export function familyLeave(ownerId: number) {
  return request({ url: `${PREFIX}/leave`, method: 'POST', data: { ownerId } })
}

export function familyView(ownerId: number) {
  return request<FamilyView>({ url: `${PREFIX}/view`, data: { ownerId } })
}
