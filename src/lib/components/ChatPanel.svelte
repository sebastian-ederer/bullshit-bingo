<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import SendHorizontal from '@lucide/svelte/icons/send-horizontal';
	import VirtualList from './VirtualList.svelte';

	type Message = {
		userId?: string;
		username: string;
		message: string;
		timestamp: number;
	};

	type Props = {
		messages: Message[];
		onsend?: (message: string) => void;
		disabled?: boolean;
		currentUserId?: string;
		firstUnreadIndex?: number;
	};

	let { messages, onsend, disabled = false, currentUserId, firstUnreadIndex }: Props = $props();
	let input = $state('');
	let keyboardOffset = $state(0);
	let inputEl: HTMLInputElement | null = $state(null);

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		const trimmed = input.trim();
		if (!trimmed || !onsend) return;
		onsend(trimmed);
		input = '';
	}

	function updateKeyboardOffset() {
		const vv = window.visualViewport;
		if (!vv) return;
		keyboardOffset = window.innerHeight - vv.height - vv.offsetTop;
		if (keyboardOffset < 0) keyboardOffset = 0;
	}

	function handleInputFocus() {
		setTimeout(() => {
			inputEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
		}, 300);
	}

	$effect(() => {
		const vv = window.visualViewport;
		if (!vv) return;
		vv.addEventListener('resize', updateKeyboardOffset);
		vv.addEventListener('scroll', updateKeyboardOffset);
		return () => {
			vv.removeEventListener('resize', updateKeyboardOffset);
			vv.removeEventListener('scroll', updateKeyboardOffset);
		};
	});
</script>

<div
	class="flex flex-col flex-1 min-h-0 py-4 gap-2"
	style:padding-bottom="{keyboardOffset > 0 ? keyboardOffset + 8 : 16}px"
>
	{#if messages.length === 0}
		<div class="flex-1 min-h-0 flex items-center justify-center">
			<p class="text-sm text-muted-foreground">No messages yet</p>
		</div>
	{:else}
		<VirtualList
			items={messages}
			estimatedHeight={48}
			overscan={10}
			scrollToEnd
			scrollToIndex={firstUnreadIndex != null && firstUnreadIndex >= 0
				? firstUnreadIndex
				: undefined}
			containerClass="flex-1 min-h-0 overflow-y-auto"
		>
			{#snippet children(msg, _i)}
				{@const isMe = currentUserId != null && msg.userId === currentUserId}
				{@const isSystem = msg.userId === 'system' || msg.username === 'System'}
				{#if isSystem}
					<div class="text-sm text-foreground italic text-center py-1">
						{msg.message}
					</div>
				{:else}
					<div class="flex py-1 {isMe ? 'justify-end' : 'justify-start'}">
						<div
							class="max-w-[95%] rounded-2xl px-3 py-1 text-sm {isMe
								? 'bg-primary text-primary-foreground rounded-tr-sm'
								: 'bg-muted rounded-tl-sm'}"
						>
							{#if !isMe}
								<p class="text-sm font-semibold mb-0.5 text-primary">{msg.username}</p>
							{/if}
							<p class="text-sm break-words">{msg.message}</p>
						</div>
					</div>
				{/if}
			{/snippet}
		</VirtualList>
	{/if}

	<form class="shrink-0 flex items-center gap-2" onsubmit={handleSubmit}>
		<Input
			bind:ref={inputEl}
			type="text"
			bind:value={input}
			placeholder="Type a message..."
			maxlength={500}
			{disabled}
			class="flex-1 text-sm"
			onfocus={handleInputFocus}
		/>
		<Button
			type="submit"
			size="icon"
			class="rounded-full shrink-0"
			disabled={disabled || !input.trim()}
		>
			<SendHorizontal class="size-4" />
		</Button>
	</form>
</div>
