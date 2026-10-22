const KEY = "maoyu_theme";

export const THEMES = [
	{ key: "leaf", name: "叶片绿", color: "#48aa7b" },
	{ key: "amber", name: "暖阳黄", color: "#f2c46d" },
	{ key: "night", name: "夜间墨绿", color: "#1f5a43" }
];

export function currentTheme(): string {
	const key = String(uni.getStorageSync(KEY) || "leaf");
	return THEMES.some((t) => t.key === key) ? key : "leaf";
}

export function setTheme(key: string) {
	if (key === "leaf") uni.removeStorageSync(KEY);
	else uni.setStorageSync(KEY, key);
}
