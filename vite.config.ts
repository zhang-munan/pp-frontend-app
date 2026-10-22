import { defineConfig } from "vite";
// 1.1.0-beta.6 的包入口误写为 /dist/index.js，显式引用实际入口。
import { cool } from "@cool-vue/unix/dist/index.js";
import { proxy } from "./config/proxy";
import tailwindcss from "tailwindcss";
import { join } from "node:path";
import uni from "@dcloudio/vite-plugin-uni";
import { preserveNativeSelectors } from "./config/selector-compat.mjs";

const resolve = (dir: string) => join(__dirname, dir);

for (const i in proxy) {
	proxy[`/${i}/`] = proxy[i];
}

export default defineConfig({
	plugins: [
		uni(),
		cool({
			proxy
		}),
		preserveNativeSelectors()
	],

	server: {
		port: 9900,
		proxy
	},

	css: {
		postcss: {
			plugins: [tailwindcss({ config: resolve("./tailwind.config.ts") })]
		}
	}
});
