export type PhraseData = {
	id: string;
	title: string;
	subtitle: string | null;
	basePoints: number;
};

export type ComboData = {
	id: string;
	name: string;
	bonusPoints: number;
	phraseIds: string[];
};

/**
 * Resolve a display name from a user-like object that may have username and/or name.
 */
export function displayName(
	user: { username?: string | null; name?: string | null } | null | undefined,
	fallback = 'Unknown'
): string {
	return user?.username ?? user?.name ?? fallback;
}
