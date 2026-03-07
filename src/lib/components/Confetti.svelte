<script lang="ts">
	const PARTICLE_COUNT = 80;
	const COLORS = ['#00c2d1', '#c850c0', '#ffd700', '#ff6b6b', '#4ecdc4', '#a855f7'];

	type Particle = {
		x: number;
		y: number;
		color: string;
		rotation: number;
		scale: number;
		drift: number;
		delay: number;
		duration: number;
		shape: 'rect' | 'circle';
	};

	function randomBetween(min: number, max: number) {
		return Math.random() * (max - min) + min;
	}

	const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
		x: randomBetween(5, 95),
		y: randomBetween(-20, -5),
		color: COLORS[Math.floor(Math.random() * COLORS.length)],
		rotation: randomBetween(0, 360),
		scale: randomBetween(0.5, 1),
		drift: randomBetween(-30, 30),
		delay: randomBetween(0, 0.6),
		duration: randomBetween(1.8, 3.2),
		shape: Math.random() > 0.4 ? 'rect' : 'circle'
	}));
</script>

<div class="confetti-container" aria-hidden="true">
	{#each particles as p, i (i)}
		<div
			class="confetti-piece"
			style="
				left: {p.x}%;
				--drift: {p.drift}px;
				--rotation: {p.rotation}deg;
				--scale: {p.scale};
				animation-delay: {p.delay}s;
				animation-duration: {p.duration}s;
			"
		>
			{#if p.shape === 'rect'}
				<div
					class="confetti-rect"
					style="background: {p.color}; transform: scale({p.scale})"
				></div>
			{:else}
				<div
					class="confetti-circle"
					style="background: {p.color}; transform: scale({p.scale})"
				></div>
			{/if}
		</div>
	{/each}
</div>

<style>
	.confetti-container {
		position: fixed;
		inset: 0;
		z-index: 201;
		pointer-events: none;
		overflow: hidden;
	}

	.confetti-piece {
		position: absolute;
		top: 0;
		animation: confetti-fall linear forwards;
		opacity: 0;
	}

	.confetti-rect {
		width: 8px;
		height: 14px;
		border-radius: 2px;
	}

	.confetti-circle {
		width: 10px;
		height: 10px;
		border-radius: 50%;
	}

	@keyframes confetti-fall {
		0% {
			transform: translateY(-10px) translateX(0) rotate(0deg);
			opacity: 1;
		}
		75% {
			opacity: 1;
		}
		100% {
			transform: translateY(100vh) translateX(var(--drift)) rotate(calc(var(--rotation) + 720deg));
			opacity: 0;
		}
	}
</style>
