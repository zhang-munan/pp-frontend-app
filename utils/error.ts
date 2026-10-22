/** 同时兼容 Error 和请求层返回的 { message } 对象。 */
export function errorMessage(error: unknown, fallback = '失败'): string {
	if (error != null && typeof error === 'object' && 'message' in error) {
		const message = (error as { message?: unknown }).message;
		if (typeof message === 'string' && message.length > 0) return message;
	}
	return fallback;
}
