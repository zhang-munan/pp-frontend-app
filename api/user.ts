import { request, upload } from "@/.cool";

/** 接口路径前缀（cool-admin 自动拼接：模块 user + controller 目录 app） */
const LOGIN_PREFIX = '/app/user/login'
const INFO_PREFIX = '/app/user/info'

/** 登录返回的 token 信息 */
export interface LoginToken {
  /** 访问 token */
  token: string
  /** token 有效期（秒） */
  expire: number
  /** 刷新 token */
  refreshToken: string
  /** 刷新 token 有效期（秒） */
  refreshExpire: number
}

/** 图片验证码 */
export interface CaptchaResult {
  /** 验证码 ID */
  captchaId: string
  /** SVG 字符串或完整的 data URL */
  data: string
}

/** 将接口返回的验证码内容转换为 image 可直接使用的地址。 */
export function getCaptchaImageSrc(data: string) {
  if (data.startsWith('data:')) return data
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(data)}`
}

/** 用户信息 */
export interface UserInfo {
  id: number
  unionid?: string
  avatarUrl?: string
  nickName?: string
  phone?: string
  /** 性别：0-未知 1-男 2-女 */
  gender?: number
  /** 状态：0-禁用 1-正常 2-已注销 */
  status?: number
  /** 登录方式：0-小程序 1-公众号 2-H5 */
  loginType?: number
  description?: string
}

/** 获取图片验证码 */
export function getCaptcha(params?: { width?: number, height?: number, color?: string }) {
  return request({
    url: `${LOGIN_PREFIX}/captcha`,
    method: 'GET',
    data: params,
    header: {
      Authorization: null,
    },
  })
}

/** 发送短信验证码（需先通过图片验证码） */
export function sendSmsCode(data: { phone: string, captchaId: string, code: string }) {
  return request({
    url: `${LOGIN_PREFIX}/smsCode`,
    method: 'POST',
    data,
    header: {
      Authorization: null,
    },
  })
}

/** 手机号验证码登录 */
export function loginByPhone(phone: string, smsCode: string, promotionCode?: string) {
  return request({
    url: `${LOGIN_PREFIX}/phone`,
    method: 'POST',
    data: { phone, smsCode, promotionCode },
    header: {
      Authorization: null,
    },
  })
}

/** 密码登录 */
export function loginByPassword(phone: string, password: string) {
  return request({
    url: `${LOGIN_PREFIX}/password`,
    method: 'POST',
    data: { phone, password },
    header: {
      Authorization: null,
    },
  })
}

/** 小程序手机号一键登录 */
export function loginByMiniPhone(data: { code: string, encryptedData: string, iv: string }) {
  return request({
    url: `${LOGIN_PREFIX}/miniPhone`,
    method: 'POST',
    data,
    header: {
      Authorization: null,
    },
  })
}

/** 小程序登录（获取用户头像昵称） */
export function loginByMini(data: { code: string, encryptedData: string, iv: string }) {
  return request({
    url: `${LOGIN_PREFIX}/mini`,
    method: 'POST',
    data,
    header: {
      Authorization: null,
    },
  })
}

/** 小程序 code 静默登录（失败不弹提示，保持游客态） */
export function loginByMiniCode(code: string) {
  return request({
    url: `${LOGIN_PREFIX}/miniCode`,
    method: 'POST',
    data: { code },
    header: { Authorization: null },
    silent: true,
  })
}

/** 公众号网页授权 code 静默登录（失败不弹提示，保持游客态） */
export function loginByMp(code: string) {
  return request({
    url: `${LOGIN_PREFIX}/mp`,
    method: 'POST',
    data: { code },
    header: { Authorization: null },
    silent: true,
  })
}

/** 构造公众号网页授权链接 */
export function getMpOauthUrl(data: { redirectUri: string, scope?: string, state?: string }) {
  return request({
    url: `${LOGIN_PREFIX}/mpOauthUrl`,
    method: 'GET',
    data,
    header: { Authorization: null },
  })
}

/** 获取公众号 JSSDK 签名配置 */
export function getWxMpConfig(url: string) {
  return request({
    url: '/app/user/comm/wxMpConfig',
    method: 'POST',
    data: { url },
    header: { Authorization: null },
  })
}

/** 为当前静默登录用户绑定短信验证的手机号 */
export function bindPhone(phone: string, smsCode: string, promotionCode?: string) {
  return request({
    url: `${LOGIN_PREFIX}/bindPhone`,
    method: 'POST',
    data: { phone, smsCode, promotionCode },
  })
}

/** 为当前静默登录用户绑定微信授权手机号 */
export function bindMiniPhone(data: { code: string, encryptedData: string, iv: string, promotionCode?: string }) {
  return request({
    url: `${LOGIN_PREFIX}/bindMiniPhone`,
    method: 'POST',
    data,
  })
}

/** 获取当前登录用户信息 */
export function getPerson() {
  return request({
    url: `${INFO_PREFIX}/person`,
    method: 'GET',
  })
}

/** 更新用户信息 */
export function updatePerson(data: Partial<UserInfo>) {
  return request({
    url: `${INFO_PREFIX}/updatePerson`,
    method: 'POST',
    data,
  })
}

/**
 * 上传个人头像。OSS 对象存储路径：send/app/user/avatar/XXX.png。
 */
export function uploadUserAvatar(filePath: string): Promise<string> {
  return upload(filePath, { prefixPath: 'send/app/user/avatar' })
}

/** 注销账号 */
export function logoff() {
  return request({
    url: `${INFO_PREFIX}/logoff`,
    method: 'POST',
  })
}
