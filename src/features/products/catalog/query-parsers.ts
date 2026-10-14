export const parseList = <T extends string>(
	value: unknown,
	allowed: readonly T[],
): T[] | undefined => {
	if (value === undefined || value === null) return undefined;
	const list = Array.isArray(value)
		? value
		: typeof value === "string"
			? value.split(",")
			: [];
	const normalized = list.map((item) => item.trim()).filter(Boolean);
	const filtered = normalized.filter((item): item is T =>
		allowed.includes(item as T),
	);
	return filtered.length ? filtered : undefined;
};

export const parseNumber = (value: unknown) => {
	if (value === undefined || value === null || value === "") return undefined;
	const raw = Array.isArray(value) ? value[0] : value;
	const num = typeof raw === "number" ? raw : Number(raw);
	return Number.isFinite(num) ? num : undefined;
};
