<script lang="ts">
	let loading = $state(false);
	let progress = $state(0);

	export function getProgress() {
		return progress;
	}

	export function updateProgress(p: number) {
		loading = true;
		progress = Math.min(100, Math.max(progress, p)); // ease-in feel

		if (p >= 100) {
			setTimeout(() => {
				loading = false;
			}, 300); // small delay for smooth UX
		}
	}

	export function resetProgress() {
		loading = false;
		progress = 0;
	}
</script>

{#if loading}
	<div class="loading-container">
		<div class="loading-bar-container">
			<div class="loading-bar" style="width: {progress}%"></div>
		</div>
		<p>Loading map...</p>
	</div>
{/if}

<style>
	.loading-container {
		height: 100%;
		width: 100%;
		position: absolute;
		z-index: 9998;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background-color: white;
	}

	.loading-bar-container {
		width: 50%;
		height: 1rem;
		border-radius: 9999px;
		background: rgba(0, 0, 0, 0.08);
		z-index: 9999;
	}

	.loading-bar {
		height: 100%;
		background: goldenrod;
		transition: width 120ms linear;
		border-radius: 9999px;
	}

	p {
		text-align: center;
		width: 100%;
	}
</style>
