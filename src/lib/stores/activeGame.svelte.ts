export type GameTab = 'game' | 'scoreboard' | 'chat';

export const activeGame = (() => {
	let active = $state(false);
	let tab = $state<GameTab>('game');
	let lastReadCount = $state(0);
	let totalMessages = $state(0);

	return {
		get active() { return active; },
		set active(v: boolean) { active = v; },
		get tab() { return tab; },
		set tab(v: GameTab) { tab = v; },
		get totalMessages() { return totalMessages; },
		set totalMessages(v: number) { totalMessages = v; },
		get lastReadCount() { return lastReadCount; },
		set lastReadCount(v: number) { lastReadCount = v; },
		get hasUnread() { return totalMessages > lastReadCount; },
		get firstUnreadIndex() { return totalMessages > lastReadCount ? lastReadCount : -1; },
		markAllRead() { lastReadCount = totalMessages; },
	};
})();
