import { messageSubscribe, reportSubscribe, type SubscribeInfo } from "@/api/message";

const ASKED_AT = "maoyu_subscribe_asked_at";
/** 同一设备两次自动询问的最小间隔 */
const ASK_INTERVAL = 6 * 3600 * 1000;

let info: SubscribeInfo | null = null;

/** 预取订阅模板；requestSubscribeMessage 必须在点击回调里同步调用，模板 id 需要提前就绪 */
export async function loadSubscribe(force = false) {
	if (info && !force) return info;
	try {
		info = await messageSubscribe();
	} catch (e) {
		info = null;
	}
	return info;
}

export function subscribeInfo() {
	return info;
}

/**
 * 请求订阅提醒。必须在点击事件的同步调用栈里调用（微信限制）。
 * 默认 6 小时内只自动询问一次，force 用于用户主动点击「去开启」。
 */
export function askSubscribe(
	keys: string[] = ["care"],
	force = false
): Promise<Record<string, string> | null> {
	return new Promise((resolve) => {
		// #ifdef MP-WEIXIN
		const tmplIds = (info?.templates || []).filter((t) => keys.includes(t.key)).map((t) => t.id);
		if (!tmplIds.length) {
			if (force) uni.showToast({ title: "订阅提醒暂未开放", icon: "none" });
			resolve(null);
			return;
		}
		if (!force && Date.now() - Number(uni.getStorageSync(ASKED_AT) || 0) < ASK_INTERVAL) {
			resolve(null);
			return;
		}
		uni.setStorageSync(ASKED_AT, Date.now());
		uni.requestSubscribeMessage({
			tmplIds,
			success: async (res: any) => {
				const results: Record<string, string> = {};
				tmplIds.forEach((id) => {
					if (res[id]) results[id] = res[id];
				});
				try {
					const counts = await reportSubscribe(results);
					if (info && counts) info.counts = counts;
				} catch (e) {
					/* 上报失败不影响当前操作 */
				}
				resolve(results);
			},
			fail: () => resolve(null)
		});
		return;
		// #endif
		resolve(null);
	});
}
