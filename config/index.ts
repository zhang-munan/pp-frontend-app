import { isMp, type Config } from "@/.cool";
import { dev } from "./dev";
import { prod } from "./prod";

// 判断当前是否为开发环境
export const isDev = process.env.NODE_ENV == "development";

// 无需登录即可访问的公开接口不携带 token，避免本地残留登录态干扰请求。
export const ignoreTokens: string[] = [
	"/app/message/info/publicList",
	"/app/message/reply/info",
	"/app/message/reply/send",
	"/app/base/comm/param",
	"/app/setting/doc/get",
	"/app/user/login/mp",
	"/app/user/login/mpOauthUrl",
	"/app/user/comm/wxMpConfig"
];

// 根据环境导出最终配置
export const config = {
	name: "毛与叶",
	locale: "zh-tw",
	website: "https://example.com",  // TODO: 部署后替换
	showDarkButton: isMp() ? false : true,
	isCustomTabBar: true,
	backTop: true,
	wx: {
		debug: false
	},
	...(isDev ? dev() : prod())
} as Config;
