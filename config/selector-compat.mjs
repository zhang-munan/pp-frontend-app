// @cool-vue/unix 1.1.0-beta.6 maps the entire selector as a class name.
// Native selectors (e.g. button::after and .m-button[disabled]) need no
// escaping. Only pass escaped utility selectors through its class mapper.
export function preserveNativeSelectors() {
	return {
		name: "maoyu-preserve-native-selectors",
		configResolved(config) {
			if (process.env.UNI_PLATFORM !== "mp-weixin") return;
			const plugins = config.css?.postcss?.plugins;
			const mapper = Array.isArray(plugins)
				? plugins.find(
						(plugin) => plugin.postcssPlugin === "vite-cool-uniappx-class-mapping"
					)
				: null;
			if (!mapper?.prepare)
				throw new Error(
					"Cannot find the Cool CSS class mapper; review selector compatibility."
				);
			const prepare = mapper.prepare;
			mapper.prepare = function (...args) {
				const visitors = prepare.apply(this, args);
				const mapRule = visitors.Rule;
				return {
					...visitors,
					Rule(rule, ...rest) {
						if (rule.selector.includes("\\")) mapRule.call(this, rule, ...rest);
					}
				};
			};
		}
	};
}
