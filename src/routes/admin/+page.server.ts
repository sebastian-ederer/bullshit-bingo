import { db } from '$lib/server/db';
import {
	topicPhrase,
	combo,
	comboField
} from '$lib/server/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { loadPhrasesAndCombos } from '$lib/server/db/queries';
import type { Actions, PageServerLoad } from './$types';

function parseIntSafe(value: string | undefined | null, fallback = 0): number {
	const parsed = parseInt(value ?? '', 10);
	return isNaN(parsed) ? fallback : parsed;
}

export const load: PageServerLoad = async () => {
	return loadPhrasesAndCombos();
};

export const actions: Actions = {
	addPhrase: async ({ request }) => {
		const data = await request.formData();
		const title = data.get('title')?.toString().trim();
		const subtitle = data.get('subtitle')?.toString().trim() || null;
		const basePoints = parseIntSafe(data.get('basePoints')?.toString());

		if (!title) return fail(400, { error: 'Phrase title is required' });

		await db.insert(topicPhrase).values({ title, subtitle, basePoints });

		return { success: true };
	},

	updatePhrase: async ({ request }) => {
		const data = await request.formData();
		const phraseId = data.get('phraseId')?.toString();
		const title = data.get('title')?.toString().trim();
		const subtitle = data.get('subtitle')?.toString().trim() || null;
		const basePoints = parseIntSafe(data.get('basePoints')?.toString());

		if (!phraseId || !title) return fail(400, { error: 'Phrase ID and title are required' });

		await db
			.update(topicPhrase)
			.set({ title, subtitle, basePoints })
			.where(eq(topicPhrase.id, phraseId));

		return { success: true };
	},

	deletePhrase: async ({ request }) => {
		const data = await request.formData();
		const phraseId = data.get('phraseId')?.toString();
		if (!phraseId) return fail(400, { error: 'Phrase ID is required' });

		// Delete combos that include this phrase
		const affectedFields = await db
			.select({ comboId: comboField.comboId })
			.from(comboField)
			.where(eq(comboField.phraseId, phraseId));

		if (affectedFields.length > 0) {
			const comboIds = [...new Set(affectedFields.map((f) => f.comboId))];
			await db.delete(comboField).where(inArray(comboField.comboId, comboIds));
			await db.delete(combo).where(inArray(combo.id, comboIds));
		}

		await db.delete(topicPhrase).where(eq(topicPhrase.id, phraseId));
		return { success: true };
	},

	addCombo: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Not authenticated' });

		const data = await request.formData();
		const name = data.get('name')?.toString().trim();
		const bonusPoints = parseIntSafe(data.get('bonusPoints')?.toString());
		const phraseIds = data.getAll('phraseIds').map((v) => v.toString());

		if (!name) return fail(400, { error: 'Combo name is required' });
		if (phraseIds.length < 2) return fail(400, { error: 'A combo needs at least 2 phrases' });

		const [newCombo] = await db
			.insert(combo)
			.values({
				name,
				bonusPoints,
				createdBy: locals.user.id
			})
			.returning();

		await db.insert(comboField).values(
			phraseIds.map((phraseId) => ({ comboId: newCombo.id, phraseId }))
		);

		return { success: true };
	},

	updateCombo: async ({ request }) => {
		const data = await request.formData();
		const comboId = data.get('comboId')?.toString();
		const name = data.get('name')?.toString().trim();
		const bonusPoints = parseIntSafe(data.get('bonusPoints')?.toString());
		const phraseIds = data.getAll('phraseIds').map((v) => v.toString());

		if (!comboId || !name) return fail(400, { error: 'Combo ID and name are required' });
		if (phraseIds.length < 2) return fail(400, { error: 'A combo needs at least 2 phrases' });

		await db
			.update(combo)
			.set({ name, bonusPoints })
			.where(eq(combo.id, comboId));

		await db.delete(comboField).where(eq(comboField.comboId, comboId));
		await db.insert(comboField).values(
			phraseIds.map((phraseId) => ({ comboId, phraseId }))
		);

		return { success: true };
	},

	deleteCombo: async ({ request }) => {
		const data = await request.formData();
		const comboId = data.get('comboId')?.toString();
		if (!comboId) return fail(400, { error: 'Combo ID is required' });

		await db.delete(comboField).where(eq(comboField.comboId, comboId));
		await db.delete(combo).where(eq(combo.id, comboId));
		return { success: true };
	}
};
