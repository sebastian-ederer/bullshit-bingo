export const headerBack = (() => {
	let value = $state<{ href: string } | null>(null);
	return {
		get value() { return value; },
		set value(v: { href: string } | null) { value = v; },
	};
})();
