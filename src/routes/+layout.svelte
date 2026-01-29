<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Pilpres 2014 vs 2019</title>
</svelte:head>

<nav>
	<a href="/" class="nav-link">Pilpres 2014 vs 2019</a>
	<a href="/about" class="nav-link">About</a>
</nav>
{@render children()}

<style>
	nav {
		background-color: #f8f9fa;
		padding: 1rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		margin-bottom: 1rem;
	}

	.nav-link {
		margin-right: 1.5rem;
		text-decoration: none;
		color: #333;
		font-weight: bold;
	}

	.nav-link:hover {
		color: goldenrod;
	}
</style>
