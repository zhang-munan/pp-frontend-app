export const proxy = {
	// 开发环境配置
	dev: {
		// 官方测试地址
		// target: "https://show.cool-admin.com/api",
		// 本地地址
		target: "http://127.0.0.1:8301",
		changeOrigin: true,
		rewrite: (path: string) => path.replace("/dev", "")
	},

	// 生产环境配置
	prod: {
		// 生产域名在 .env.production 的 VITE_APP_HOST 中配置
		target: (import.meta.env.VITE_APP_HOST as string) || "https://example.com",
		changeOrigin: true,
		rewrite: (path: string) => path.replace("/prod", "/maoyu_api")
	}
};

export const value = "dev";
