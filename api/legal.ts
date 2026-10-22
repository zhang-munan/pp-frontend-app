import { request } from "@/.cool";

export const LEGAL_TITLES: Record<string, string> = {
	user_agreement: "用户协议",
	privacy_policy: "隐私政策",
	plus_agreement: "Plus 会员服务协议",
	ai_notice: "AI 使用说明"
};

const LEGAL_KEYS: Record<string, string> = {
	user_agreement: "userAgreement",
	privacy_policy: "privacyPolicy",
	plus_agreement: "plusAgreement",
	ai_notice: "aiNotice"
};

export async function legalContent(kind: string) {
	const key = LEGAL_KEYS[kind] || "userAgreement";
	const value = await request({ url: "/app/base/comm/param", data: { key }, silent: true });
	return typeof value === "string"
		? value
		: typeof value?.content === "string"
			? value.content
			: "";
}
