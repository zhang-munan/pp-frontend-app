import { request } from "@/.cool";
export async function legalContent(kind: string) {
	const key = kind === "privacy_policy" ? "privacyPolicy" : "userAgreement";
	const value = await request({ url: "/app/base/comm/param", data: { key }, silent: true });
	return typeof value === "string"
		? value
		: typeof value?.content === "string"
			? value.content
			: "";
}
