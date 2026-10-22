import { ref, computed } from "vue";
import { useStore } from "@/.cool";
import { myPets, healthList, type PetInfo, type PetHealth } from "@/api/pet";
import { myPlants, water, undoWater, type PlantInfo } from "@/api/plant";
import { today as getToday, type TodayResult } from "@/api/care";
import { errorMessage } from "@/utils/error";

export const asset = (name: string) => "/static/maoyu/" + name;
export function dateKey(date = new Date()) {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function addDays(date: string, n: number) {
	const d = new Date(date + "T12:00:00");
	d.setDate(d.getDate() + n);
	return dateKey(d);
}
export function daysFromToday(date?: string) {
	if (!date) return null;
	return Math.round(
		(Date.parse(date.slice(0, 10) + "T12:00:00") - Date.parse(dateKey() + "T12:00:00")) /
			86400000
	);
}
export function ageText(birthday?: string) {
	if (!birthday) return "生日待完善";
	const born = new Date(birthday + "T12:00:00"),
		now = new Date();
	let months =
		(now.getFullYear() - born.getFullYear()) * 12 +
		now.getMonth() -
		born.getMonth() -
		(now.getDate() < born.getDate() ? 1 : 0);
	months = Math.max(0, months);
	return months < 12
		? `${months}个月`
		: `${Math.floor(months / 12)}岁${months % 12 ? (months % 12) + "个月" : ""}`;
}
export const demoPets: PetInfo[] = [
	{
		id: -1,
		name: "咪咪",
		species: 0,
		breed: "英国短毛猫",
		avatar: asset("cat-hero.jpg"),
		gender: 2,
		birthday: "2024-06-16",
		neutered: 1,
		status: 0
	},
	{
		id: -2,
		name: "豆豆",
		species: 0,
		breed: "橘猫",
		avatar: asset("orange-cat.jpg"),
		gender: 1,
		birthday: "2025-03-01",
		neutered: 1,
		status: 0
	}
];
export function demoPlants(): PlantInfo[] {
	return [
		{
			id: -1,
			name: "大白",
			speciesName: "龟背竹",
			avatar: asset("monstera.jpg"),
			location: 0,
			waterCycleDays: 6,
			fertilizeCycleDays: 30,
			nextWaterDate: dateKey(),
			status: 0
		},
		{
			id: -2,
			name: "小绿",
			speciesName: "绿萝",
			avatar: asset("pothos.jpg"),
			location: 1,
			waterCycleDays: 5,
			fertilizeCycleDays: 30,
			nextWaterDate: addDays(dateKey(), -1),
			status: 0
		},
		{
			id: -3,
			name: "小胖",
			speciesName: "多肉",
			avatar: asset("succulent.jpg"),
			location: 4,
			waterCycleDays: 10,
			fertilizeCycleDays: 30,
			nextWaterDate: addDays(dateKey(), 3),
			status: 0
		}
	];
}
export function demoRecords(id = -1): PetHealth[] {
	return [
		{
			id: -1,
			petId: id,
			type: 1,
			itemName: "体外驱虫",
			subType: "体外",
			occurDate: addDays(dateKey(), -5),
			nextDate: addDays(dateKey(), 2),
			cycleDays: 30,
			remark: "已完成本次驱虫"
		},
		...[4.8, 4.9, 5, 5.1, 5.2].map((value, i) => ({
			id: -10 - i,
			petId: id,
			type: 2,
			itemName: "体重记录",
			occurDate: addDays(dateKey(), -28 + i * 7),
			value,
			unit: "kg",
			cycleDays: 0
		})),
		{
			id: -20,
			petId: id,
			type: 0,
			itemName: "猫三联",
			occurDate: "2026-06-16",
			nextDate: "2027-06-16",
			cycleDays: 365
		}
	];
}
const pets = ref<PetInfo[]>([]),
	plants = ref<PlantInfo[]>([]),
	today = ref<TodayResult>({ date: "", water: [], health: [], total: 0 });
const loading = ref(false),
	error = ref(""),
	selectedPet = ref(0),
	guest = ref(true),
	lastOwner = ref(""),
	pending = ref<number[]>([]),
	undoIds = ref<number[]>([]),
	undoMessage = ref("");
let inflight: Promise<void> | null = null;
export function photo(item: any, kind = "plant") {
	if (item?.avatar && /^(https?:|\/|data:|blob:|wxfile:)/.test(item.avatar))
		return kind === "pet" && item.avatar.endsWith("/cat-hero.jpg")
			? asset("cat-avatar.jpg")
			: item.avatar;
	return asset(
		kind === "pet"
			? "cat-hero.jpg"
			: /绿萝/.test(item?.speciesName || "")
				? "pothos.jpg"
				: /多肉/.test(item?.speciesName || "")
					? "succulent.jpg"
					: "monstera.jpg"
	);
}
export function open(page: string, query = "") {
	uni.navigateTo({ url: "/package-user/" + page + (query ? "?" + query : "") });
}
export function login() {
	open("login");
}
export function requireLogin() {
	if (!useStore().user.token) {
		login();
		return false;
	}
	return true;
}
export function useMaoyu() {
	const user = useStore().user;
	const visiblePets = computed(() => (guest.value ? demoPets : pets.value));
	const visiblePlants = computed(() => (guest.value ? demoPlants() : plants.value));
	const currentPet = computed(
		() => visiblePets.value.find((p) => p.id === selectedPet.value) || visiblePets.value[0]
	);
	async function refresh() {
		const owner = user.token ? String(user.info.value?.id || "signed-in") : "guest";
		guest.value = !user.token;
		if (owner !== lastOwner.value) {
			pets.value = [];
			plants.value = [];
			today.value = { date: "", water: [], health: [], total: 0 };
			undoIds.value = [];
			undoMessage.value = "";
			error.value = "";
			lastOwner.value = owner;
		}
		if (guest.value) {
			loading.value = false;
			return;
		}
		if (inflight) return inflight;
		loading.value = true;
		error.value = "";
		inflight = (async () => {
			try {
				const [p, l, t] = await Promise.all([myPets(), myPlants(), getToday()]);
				if (lastOwner.value !== owner) return;
				pets.value = p || [];
				plants.value = l || [];
				today.value = t || { date: "", water: [], health: [], total: 0 };
			} catch (e) {
				error.value = errorMessage(e) || "加载失败，请重试";
			} finally {
				loading.value = false;
				inflight = null;
			}
		})();
		return inflight;
	}
	async function waterPlants(items: PlantInfo[]) {
		if (!requireLogin()) return;
		const targets = items.filter((p) => p.id > 0 && !pending.value.includes(p.id));
		if (!targets.length) return;
		pending.value.push(...targets.map((p) => p.id));
		let success: number[] = [];
		for (const p of targets) {
			try {
				await water(p.id);
				success.push(p.id);
			} catch (e) {
				/* The request layer reports the individual error. */
			}
		}
		pending.value = pending.value.filter((id) => !targets.some((p) => p.id === id));
		if (success.length) {
			undoIds.value = success;
			undoMessage.value = `已为 ${success.length} 株植物浇水${success.length < targets.length ? "，部分未成功" : ""}`;
			await refresh();
		}
	}
	async function undo() {
		if (pending.value.length) return;
		pending.value = [...undoIds.value];
		let failed: number[] = [];
		for (const id of undoIds.value) {
			try {
				await undoWater(id);
			} catch (e) {
				failed.push(id);
			}
		}
		pending.value = [];
		undoIds.value = failed;
		undoMessage.value = failed.length ? "部分撤销失败，请重试" : "";
		await refresh();
	}
	return {
		pets,
		plants,
		today,
		loading,
		error,
		guest,
		visiblePets,
		visiblePlants,
		currentPet,
		selectedPet,
		refresh,
		waterPlants,
		undo,
		pending,
		undoMessage,
		user
	};
}
export function waterText(p: PlantInfo) {
	if (p.lastWaterDate?.slice(0, 10) === dateKey()) return "今天已浇水";
	const d = daysFromToday(p.nextWaterDate);
	return d === null
		? "尚未设置提醒"
		: d < 0
			? `超期 ${-d} 天`
			: d === 0
				? "今天该浇水啦"
				: `${d} 天后浇水`;
}
export function isDue(p: PlantInfo) {
	const d = daysFromToday(p.nextWaterDate);
	return d !== null && d <= 0 && p.lastWaterDate?.slice(0, 10) !== dateKey();
}
