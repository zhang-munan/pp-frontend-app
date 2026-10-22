import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const { parse, compileScript, compileTemplate } = require("vue/compiler-sfc");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = [
	"App.uvue",
	...["pages", "components", "package-user"].flatMap((d) =>
		fs
			.readdirSync(path.join(root, d))
			.filter((f) => f.endsWith(".uvue"))
			.map((f) => d + "/" + f)
	)
];
const errors = [];
for (const file of files) {
	try {
		const source = fs.readFileSync(path.join(root, file), "utf8");
		const { descriptor, errors: parseErrors } = parse(source, { filename: file });
		if (parseErrors.length) throw parseErrors;
		const script =
			descriptor.script || descriptor.scriptSetup
				? compileScript(descriptor, { id: file })
				: null;
		if (descriptor.template) {
			const result = compileTemplate({
				id: file,
				filename: file,
				source: descriptor.template.content,
				compilerOptions: { bindingMetadata: script?.bindings }
			});
			if (result.errors.length) throw result.errors;
		}
	} catch (error) {
		errors.push({ file, error: String(error) });
	}
}
const pages = JSON.parse(fs.readFileSync(path.join(root, "pages.json"), "utf8"));
const routes = [
	...pages.pages.map((p) => p.path),
	...pages.subPackages.flatMap((g) => g.pages.map((p) => g.root + "/" + p.path))
];
for (const route of routes)
	if (!fs.existsSync(path.join(root, route + ".uvue")))
		errors.push({ file: route, error: "Missing route component" });
console.log(JSON.stringify({ components: files.length, routes: routes.length, errors }, null, 2));
if (errors.length) process.exitCode = 1;
