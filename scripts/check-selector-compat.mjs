import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import postcss from "postcss";
import { preserveNativeSelectors } from "../config/selector-compat.mjs";

const require = createRequire(import.meta.url);
process.env.UNI_INPUT_DIR = fileURLToPath(new URL("..", import.meta.url));
const { cool } = require("@cool-vue/unix/dist/index.js");
process.env.UNI_PLATFORM = "mp-weixin";
process.env.UNI_UTS_PLATFORM = "mp-weixin";
const cssPlugin = cool({ proxy: { "/dev/": { target: "http://localhost", rewrite: () => "" } } })
	.flat(Infinity)
	.find((plugin) => plugin.name === "vite-cool-unix-tailwind-css");
const config = cssPlugin.config();
const source = String.raw`
button::after, .m-plain::after { border: none !important; }
.pet-option.selected:after { content: ""; }
.m-button[disabled] { opacity: .5; }
.menu > .item:last-child { border-bottom: 0; }
.w-\[40px\] { width: 40px; }
.bg-black\/50 { background: rgb(0 0 0 / .5); }
`;
// Reproduce the actual dependency bug before exercising the workaround.
const broken = await postcss(config.css.postcss.plugins).process(source, { from: undefined });
assert.match(broken.css, /button-colon--colon-after/);
preserveNativeSelectors().configResolved(config);
const fixed = await postcss(config.css.postcss.plugins).process(source, { from: undefined });
const selectors = [];
fixed.root.walkRules((rule) => selectors.push(rule.selector));
assert.deepEqual(selectors, [
	"button::after, .m-plain::after",
	".pet-option.selected:after",
	".m-button[disabled]",
	".menu > .item:last-child",
	".w--bracket-start-40px-bracket-end-",
	".bg-black-slash-50"
]);
assert.match(fixed.css, /rgba\(0, 0, 0, .5\)/);
console.log("WXSS selector compatibility: passed (native selectors and utility mapping).");
