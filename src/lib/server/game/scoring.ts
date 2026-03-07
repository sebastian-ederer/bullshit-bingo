import type { ComboData } from '$lib/types';

/**
 * Calculate points earned from marking a field.
 * Awards field basePoints + any newly completed combos.
 */
export function calculateMarkScore(
	markedPhraseId: string,
	allMarkedPhraseIds: string[],
	cardPhraseIds: string[],
	combos: ComboData[],
	alreadyScoredComboIds: string[],
	fieldBasePoints: number
): { pointsEarned: number; newCombos: { id: string; name: string; bonusPoints: number }[] } {
	let pointsEarned = fieldBasePoints;
	const newCombos: { id: string; name: string; bonusPoints: number }[] = [];
	const scoredSet = new Set(alreadyScoredComboIds);
	const markedSet = new Set(allMarkedPhraseIds);
	const cardSet = new Set(cardPhraseIds);

	for (const combo of combos) {
		if (scoredSet.has(combo.id)) continue;

		// All combo fields must be on the player's card AND all must be marked
		const allOnCard = combo.phraseIds.every((pid) => cardSet.has(pid));
		if (!allOnCard) continue;

		const allMarked = combo.phraseIds.every((pid) => markedSet.has(pid));
		if (!allMarked) continue;

		pointsEarned += combo.bonusPoints;
		newCombos.push({ id: combo.id, name: combo.name, bonusPoints: combo.bonusPoints });
	}

	return { pointsEarned, newCombos };
}
