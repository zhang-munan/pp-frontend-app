import { request } from "@/.cool";

const MEMBER = '/app/member/info'
const PRODUCT = '/app/order/product'
const ORDER = '/app/order/info'

/** 会员套餐（含当前用户实付价） */
export interface ProductInfo {
  id: number
  name: string
  subtitle?: string
  planType: number // 0月卡 1年卡 2终身
  durationDays: number
  tagContent?: string
  tagBackgroundColor?: string
  description?: string
  originalPrice: number
  sellPrice: number
  firstPrice: number
  payAmount: number
  firstYear: boolean
}

export interface MemberStatus {
  isPlus: boolean
  isLifetime: boolean
  expireTime: string | null
  firstYearUsed: boolean
  iosPayEnabled: boolean
  free: { pets: number; plants: number; aiAsk: number; aiIdentify: number }
}

export interface OrderInfo {
  id: number
  orderNo: string
  productId?: number
  productName?: string
  originalPrice: number
  discountAmount: number
  payAmount: number
  payMethod?: number
  status: number // 0待支付 1已支付 2已退款 3已关闭
  payTime?: string
  createTime: string
  payParams?: any
  refundAmount?: number
  refundReason?: string
  refundStatus?: number // 0未申请 1待审批 2已退款 3已拒绝 4退款处理中 5退款失败
  refundRejectReason?: string
}

interface WxPayParams {
  orderId: number
  timeStamp: string
  nonceStr: string
  package: string
  signType: 'RSA' | 'MD5'
  paySign: string
}

export const PLAN_NAMES = ['月卡', '年卡', '终身卡']
export const ORDER_STATUS_NAMES = ['待支付', '已支付', '已退款', '已关闭']
export const REFUND_STATUS_NAMES = ['', '退款审核中', '已退款', '退款被拒绝', '退款处理中', '退款失败']
export const PAY_METHOD = { WECHAT: 1, MOCK: 2 }

export function memberStatus() {
  return request<MemberStatus>({ url: `${MEMBER}/status` })
}

export function productList() {
  return request<ProductInfo[]>({ url: `${PRODUCT}/list` })
}

/** 当前运行平台，iOS 需由后端决定是否允许购买 */
export function currentPlatform(): string {
  const info = uni.getSystemInfoSync()
  return String(info.osName || info.platform || '').toLowerCase()
}

export function isIOS() {
  return currentPlatform() === 'ios'
}

export function createOrder(productId: number) {
  return request<OrderInfo>({
    url: `${ORDER}/create`,
    method: 'POST',
    data: { productId, platform: currentPlatform() }
  })
}

export function payOrder(orderId: number, payMethod: number, code?: string) {
  return request<any>({
    url: `${ORDER}/pay`,
    method: 'POST',
    data: { orderId, payMethod, code }
  })
}

/** 轮询用，失败不弹提示 */
export function queryOrderStatus(orderId: number) {
  return request<OrderInfo>({
    url: `${ORDER}/status`,
    data: { orderId },
    silent: true
  })
}

export function orderDetail(id: number) {
  return request<OrderInfo>({ url: `${ORDER}/detail`, data: { id } })
}

export function orderList(page = 1, size = 20) {
  return request<{ list: OrderInfo[]; pagination: { page: number; size: number; total: number } }>({
    url: `${ORDER}/orderList`,
    data: { page, size }
  })
}

export function applyRefund(orderId: number, reason: string) {
  return request<OrderInfo>({
    url: `${ORDER}/applyRefund`,
    method: 'POST',
    data: { orderId, reason }
  })
}

function wxLoginCode(): Promise<string> {
  return new Promise((resolve) => {
    // #ifdef MP-WEIXIN
    uni.login({
      provider: 'weixin',
      success: (res) => resolve(res.code),
      fail: () => resolve('')
    })
    return
    // #endif
    resolve('')
  })
}

function requestWxPayment(params: WxPayParams): Promise<void> {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    uni.requestPayment({
      provider: 'wxpay',
      timeStamp: params.timeStamp,
      nonceStr: params.nonceStr,
      package: params.package,
      signType: params.signType,
      paySign: params.paySign,
      success: () => resolve(),
      fail: (err: any) =>
        reject(new Error(String(err?.errMsg || '').includes('cancel') ? '已取消支付' : '支付失败，请重试'))
    })
    return
    // #endif
    reject(new Error('请在微信小程序中完成支付'))
  })
}

/** 支付成功后等待回调入账，超时交给订单页继续补查 */
export async function pollPaid(orderId: number, maxRetry = 10, interval = 2000): Promise<OrderInfo | null> {
  for (let i = 0; i < maxRetry; i++) {
    try {
      const order = await queryOrderStatus(orderId)
      if (order?.status === 1) return order
    } catch (e) {
      /* 下一轮继续查询 */
    }
    await new Promise((r) => setTimeout(r, interval))
  }
  return null
}

/** 微信支付：拿 code → 后端预下单 → 调起支付 → 轮询入账 */
export async function wxPay(orderId: number) {
  const code = await wxLoginCode()
  const params = (await payOrder(orderId, PAY_METHOD.WECHAT, code)) as WxPayParams
  await requestWxPayment(params)
  return pollPaid(orderId)
}

/** 开发环境模拟支付 */
export async function mockPay(orderId: number) {
  await payOrder(orderId, PAY_METHOD.MOCK)
  return pollPaid(orderId, 3, 500)
}
