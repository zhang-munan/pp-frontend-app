import { ref } from "vue";
import { assign, getUrlParam, storage } from "../utils";
import { request } from "../service";
import { t } from "../locale";
import { config } from "@/config";
import { useStore } from "../store";

// #ifdef H5
import wx from "weixin-js-sdk";
// #endif

const MP_OAUTH_TRIED_KEY = "wx_mp_oauth_tried";
const MP_RETURN_HASH_KEY = "wx_mp_return_hash";
const MP_CODE_KEY = "mpCode";

// 微信配置类型
type WxConfig = {
	appId: string;
};

type MpOauthResult = {
	appid: string;
	scope: string;
	state: string;
	redirectUri: string;
	oauthUrl: string;
};

// 微信相关功能封装类
export class Wx {
	// 微信登录code
	code = ref("");

	/**
	 * 获取微信登录code
	 */
	async getCode(): Promise<string> {
		return new Promise((resolve) => {
			// #ifdef MP-WEIXIN
			uni.login({
				provider: "weixin",
				success: (res) => {
					this.code.value = res.code;
					resolve(res.code);
				}
			});
			// #endif

			// #ifndef MP-WEIXIN
			resolve("");
			// #endif
		});
	}

	// #ifdef H5
	// 公众号配置
	mpConfig: WxConfig = {
		appId: ""
	};

	private jsSdkReady = false;
	private jsSdkUrl = "";

	/**
	 * 判断当前是否为微信浏览器
	 */
	isWxBrowser() {
		const ua: string = window.navigator.userAgent.toLowerCase();
		if (ua.match(/MicroMessenger/i) != null) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * 当前网页授权回调地址，不含 hash 和已有 query，避免微信把 code 拼到错误位置。
	 */
	getOauthRedirectUri() {
		return `${window.location.origin}${window.location.pathname}`;
	}

	/**
	 * 从回调 URL 取出 code，并去掉 code/state，防止刷新重复消耗。
	 */
	takeOauthCode(): string | null {
		const code = getUrlParam("code");
		if (code == null || code == "") {
			return null;
		}

		const url = window.location.href.replace(/(\?[^#]*)#/, "#").replace(/\?[^#]*$/, "");
		window.history.replaceState({}, "", url);

		const lastCode = storage.get(MP_CODE_KEY);
		if (code == lastCode) {
			return null;
		}
		storage.set(MP_CODE_KEY, code, 300);
		return code;
	}

	private restoreReturnHash() {
		const hash = sessionStorage.getItem(MP_RETURN_HASH_KEY);
		sessionStorage.removeItem(MP_RETURN_HASH_KEY);
		if (hash != null && hash != "" && hash != window.location.hash) {
			window.location.hash = hash;
		}
	}

	/**
	 * 获取公众号配置信息，并初始化微信JS-SDK
	 */
	getMpConfig(): Promise<void> {
		return new Promise((resolve) => {
			if (!this.isWxBrowser()) {
				resolve();
				return;
			}

			const url = window.location.href.split("#")[0];
			if (this.jsSdkReady && this.jsSdkUrl == url) {
				resolve();
				return;
			}

			request({
				url: "/app/user/comm/wxMpConfig",
				method: "POST",
				header: {
					Authorization: null
				},
				data: {
					url
				}
			})
				.then((res) => {
					if (res == null) {
						resolve();
						return;
					}

					wx.config({
						debug: config.wx.debug,
						jsApiList: res.jsApiList || ["chooseWXPay"],
						appId: res.appId,
						timestamp: res.timestamp,
						nonceStr: res.nonceStr,
						signature: res.signature,
						openTagList: res.openTagList
					});

					assign(this.mpConfig, res);
					this.jsSdkUrl = url;
					wx.ready(() => {
						this.jsSdkReady = true;
						resolve();
					});
					wx.error(() => {
						this.jsSdkReady = false;
						resolve();
					});
				})
				.catch(() => {
					resolve();
				});
		});
	}

	/**
	 * 跳转到微信静默授权页面。
	 * 授权链接参数顺序必须与微信文档一致。
	 */
	async mpAuth() {
		const redirectUri = this.getOauthRedirectUri();
		const res = (await request({
			url: "/app/user/login/mpOauthUrl",
			method: "GET",
			header: {
				Authorization: null
			},
			data: {
				redirectUri,
				scope: "snsapi_userinfo",
				state: "silent"
			}
		})) as MpOauthResult | null;

		if (res == null || res.oauthUrl == null || res.oauthUrl == "") {
			throw { message: t("未获取到微信授权链接") };
		}

		this.mpConfig.appId = res.appid;
		window.location.href = res.oauthUrl;
	}

	/**
	 * 公众号静默登录：有 code 则换 token，无登录态则跳转 snsapi_base。
	 */
	async ensureSilentLogin(): Promise<boolean> {
		if (!this.isWxBrowser()) {
			return false;
		}

		const { user } = useStore();
		const code = this.takeOauthCode();

		if (code != null && code != "") {
			try {
				const token = await request({
					url: "/app/user/login/mp",
					method: "POST",
					header: {
						Authorization: null
					},
					data: { code }
				});
				if (token != null) {
					user.setToken(token);
					sessionStorage.removeItem(MP_OAUTH_TRIED_KEY);
				}
			} catch (err) {
				console.warn("公众号静默登录失败", err);
			}
			this.restoreReturnHash();
			if (user.token != null) {
				await this.getMpConfig();
			}
			return user.token != null;
		}

		if (user.token != null) {
			await this.getMpConfig();
			return true;
		}

		if (sessionStorage.getItem(MP_OAUTH_TRIED_KEY) == "1") {
			return false;
		}

		sessionStorage.setItem(MP_OAUTH_TRIED_KEY, "1");
		sessionStorage.setItem(MP_RETURN_HASH_KEY, window.location.hash || "");
		try {
			await this.mpAuth();
		} catch (err) {
			sessionStorage.removeItem(MP_OAUTH_TRIED_KEY);
			console.warn("跳转微信授权失败", err);
		}
		return false;
	}

	/**
	 * 公众号微信支付
	 * @param params 支付参数
	 */
	mpPay(params: { timeStamp: string; nonceStr: string; package: string; signType: string; paySign: string }): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.isWxBrowser()) {
				reject({ message: t("请在微信浏览器中打开") });
				return;
			}

			this.getMpConfig()
				.then(() => {
					wx.chooseWXPay({
						timestamp: Number(params.timeStamp),
						nonceStr: params.nonceStr,
						package: params.package,
						signType: params.signType,
						paySign: params.paySign,
						success() {
							resolve();
						},
						cancel() {
							reject({ message: t("已取消支付") });
						},
						fail() {
							reject({ message: t("支付失败") });
						}
					});
				})
				.catch(() => {
					reject({ message: t("微信支付初始化失败") });
				});
		});
	}
	// #endif

	// #ifdef MP
	/**
	 * 小程序登录，获取用户信息和code
	 */
	miniLogin(): Promise<{
		code: string;
		iv: string;
		encryptedData: string;
		signature: string;
		rawData: string;
	}> {
		return new Promise((resolve, reject) => {
			// 兼容 Mac，Mac 端需用 getUserInfo
			const k = uni.getDeviceInfo().platform === "mac" ? "getUserInfo" : "getUserProfile";

			uni[k]({
				lang: "zh_CN",
				desc: t("授权信息仅用于用户登录"),
				success: ({ iv, encryptedData, signature, rawData }) => {
					const next = () => {
						resolve({
							iv,
							encryptedData,
							signature,
							rawData,
							code: this.code.value
						});
					};

					// 检查登录状态是否过期
					uni.checkSession({
						success: () => {
							next();
						},
						fail: () => {
							this.getCode().then(() => {
								next();
							});
						}
					});
				},
				fail: (err) => {
					console.error(`[useWx.miniLogin] error`, err);
					this.getCode();

					reject(t("登录授权失败"));
				}
			});
		});
	}

	/**
	 * 小程序微信支付
	 * @param params 支付参数
	 */
	miniPay(params: any): Promise<void> {
		return new Promise((resolve, reject) => {
			uni.requestPayment({
				provider: "wxpay",
				...params,
				success() {
					resolve();
				},
				fail() {
					reject(t("已取消支付"));
				}
			});
		});
	}
	// #endif
}

/**
 * 单例，供 H5 启动时静默登录和支付复用，避免每页重复授权。
 */
export const wxHelper = new Wx();

let silentLoginPromise: Promise<boolean> | null = null;

/**
 * 微信内打开 H5 时静默登录。非微信浏览器直接跳过。
 */
export function ensureWechatMpSilentLogin(): Promise<boolean> {
	// #ifdef H5
	if (silentLoginPromise != null) {
		return silentLoginPromise;
	}
	silentLoginPromise = wxHelper.ensureSilentLogin().catch((err) => {
		silentLoginPromise = null;
		console.warn("公众号静默登录异常", err);
		return false;
	});
	return silentLoginPromise;
	// #endif

	return Promise.resolve(false);
}

/**
 * useWx 钩子函数，后续可扩展
 */
export const useWx = (): Wx => {
	const instance = wxHelper;

	onReady(() => {
		instance.getCode();
	});

	return instance;
};
