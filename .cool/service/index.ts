import { isDev, ignoreTokens, config } from "@/config";
import { locale, t } from "../locale";
import { isNull, isObject, parse, storage } from "../utils";
import { useStore } from "../store";

// 请求参数类型定义
export type RequestOptions = {
	url: string; // 请求地址
	method?: RequestMethod; // 请求方法
	data?: any; // 请求体数据
	params?: any; // URL参数
	header?: any; // 请求头
	timeout?: number; // 超时时间
	withCredentials?: boolean; // 是否携带凭证
	firstIpv4?: boolean; // 是否优先使用IPv4
	enableChunked?: boolean; // 是否启用分块传输
	silent?: boolean; // 报错时不弹统一错误提示（轮询、静默登录等后台场景）
};

// 响应数据类型定义
export type Response = {
	code?: number;
	message?: string;
	data?: any;
};

// 请求队列（用于等待token刷新后继续请求）
let requests: ((token: string) => void)[] = [];

// 标记token是否正在刷新
let isRefreshing = false;

/**
 * 统一错误提示（接口报错时弹出 toast）
 * @param message 错误信息
 * @param silent 是否静默（不弹提示）
 */
function toastError(message: string | undefined, silent?: boolean) {
	if (silent) {
		return;
	}

	uni.showToast({
		title: message || t("服务异常"),
		icon: "none",
		duration: 2500
	});
}

// 判断当前url是否忽略token校验
const isIgnoreToken = (url: string) => {
	return ignoreTokens.some((e) => {
		const pattern = e.replace(/\*/g, ".*");
		return new RegExp(pattern).test(url);
	});
};

/**
 * 通用请求方法
 * @param options 请求参数
 * @returns Promise<T>
 */
export function request<T = any>(options: RequestOptions): Promise<T | null> {
	let { url, method = "GET", data = {}, header = {}, timeout = 60000 } = options;

	const { user } = useStore();

	// 开发环境下打印请求信息
	if (isDev) {
		console.log(`[${method}] ${url}`);
	}

	// 拼接基础url
	if (!url.startsWith("http")) {
		url = config.baseUrl + url;
	}

	// 获取当前token
	let Authorization: string | null = user.token;

	// 如果是忽略token的接口，则不携带token
	if (isIgnoreToken(url)) {
		Authorization = null;
	}

	return new Promise<T | null>((resolve, reject) => {
		// 发起请求的实际函数
		const next = () => {
			uni.request({
				url,
				method,
				data,
				header: {
					Authorization,
					language: locale.value,
					...(header as UTSJSONObject)
				},
				timeout,

			success(res) {
					// 401 无权限
					if (res.statusCode == 401) {
						user.logout();
						toastError(t("请先登录"), options.silent);
						reject({ message: t("无权限") } as Response);
					}

					// 502 服务异常
					else if (res.statusCode == 502) {
						toastError(t("服务异常"), options.silent);
						reject({
							message: t("服务异常")
						} as Response);
					}

					// 404 未找到
					else if (res.statusCode == 404) {
						toastError(`[404] ${url}`, options.silent);
						return reject({
							message: `[404] ${url}`
						} as Response);
					}

					// 200 正常响应
					else if (res.statusCode == 200) {
						if (res.data == null) {
							resolve(null);
						} else if (!isObject(res.data as any)) {
							resolve(res.data as T);
						} else {
							// 解析响应数据
							const { code, message, data } = parse<Response>(
								res.data ?? { code: 0 }
							)!;

							switch (code) {
								case 1000:
									resolve(data);
									break;
								default:
									toastError(message, options.silent);
									reject({ message, code } as Response);
									break;
							}
						}
					} else {
						toastError(t("服务异常"), options.silent);
						reject({ message: t("服务异常") } as Response);
					}
				},

				// 网络请求失败
				fail(err) {
					toastError(t("网络异常，请检查网络"), options.silent);
					reject({ message: err.errMsg } as Response);
				}
			});
		};

		// 非刷新token接口才进行token有效性校验
		if (!options.url.includes("/refreshToken")) {
			if (!isNull(Authorization)) {
				// 判断token是否过期
				if (storage.isExpired("token")) {
					// 判断refreshToken是否过期
					if (storage.isExpired("refreshToken")) {
						// 刷新token也过期，直接退出登录
						user.logout();
						return;
					}

					// 如果当前没有在刷新token，则发起刷新
					if (!isRefreshing) {
						isRefreshing = true;
						user.refreshToken()
							.then((token) => {
								// 刷新成功后，执行队列中的请求
								requests.forEach((cb) => cb(token));
								requests = [];
								isRefreshing = false;
							})
							.catch((err) => {
								reject(err);
								user.logout();
							});
					}

					// 将当前请求加入队列，等待token刷新后再执行
					new Promise((resolve) => {
						requests.push((token: string) => {
							// 重新设置token
							Authorization = token;
							next();
							resolve(true);
						});
					});
					// 此处return，等待token刷新
					return;
				}
			}
		}

		// token有效，直接发起请求
		next();
	});
}
