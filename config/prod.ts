import { get } from "@/.cool";
import { proxy } from "./proxy";

export const prod = () => {
	let host: string;
	let baseUrl: string;

	// #ifdef H5
	// H5 与管理后台共用域名，统一通过宿主机 Nginx 的 /maoyu_api 访问后端。
	host = window.location.origin;
	baseUrl = "/maoyu_api";
	// #endif

	// #ifndef H5
	host = get(proxy, `prod.target`) as string;
	baseUrl = host + "/maoyu_api";
	// #endif

	return {
		host,
		baseUrl
	};
};
