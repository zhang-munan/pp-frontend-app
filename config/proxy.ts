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
		// 官方测试地址
		target: "https://example.com",  // TODO: 部署后替换为实际生产域名
		changeOrigin: true,
		rewrite: (path: string) => path.replace("/prod", "/maoyu_api")
	}
};

export const value = "dev";
