import type { SubmitFunction } from '@sveltejs/kit';

export function useSubmitting(fn?: SubmitFunction) {
	let submitting = $state(false);

	const enhance: SubmitFunction = (input) => {
		submitting = true;
		const callback = fn?.(input);

		if (typeof callback === 'function') {
			return async (opts) => {
				try {
					await callback(opts);
				} finally {
					submitting = false;
				}
			};
		}

		return async ({ update }) => {
			try {
				await update();
			} finally {
				submitting = false;
			}
		};
	};

	return {
		get submitting() {
			return submitting;
		},
		enhance
	};
}
