import { isMp, type Config } from "@/.cool";
import { dev } from "./dev";
import { prod } from "./prod";

// 判断当前是否为开发环境
export const isDev = process.env.NODE_ENV == "development";

// 无需登录即可访问的公开接口不携带 token，避免本地残留登录态干扰请求。
export const ignoreTokens: string[] = [
	"/app/base/comm/param",
	"/app/plant/species/search",
	"/app/plant/guide/species",
	"/app/plant/guide/diseases",
	"/app/user/login/mp",
	"/app/user/login/mpOauthUrl",
	"/app/user/comm/wxMpConfig"
];

// 根据环境导出最终配置
export const config = {
	name: "毛与叶",
	locale: "zh-cn",
	website: (import.meta.env.VITE_APP_HOST as string) || "https://example.com",
	showDarkButton: isMp() ? false : true,
	isCustomTabBar: true,
	backTop: true,
	wx: {
		debug: false
	},
	...(isDev ? dev() : prod())
} as Config;
