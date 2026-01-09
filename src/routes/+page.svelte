<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { featureCollection } from '@turf/helpers';
	import maplibregl from 'maplibre-gl';
	import { loadFlatGeobuf, processArrowData } from '../utils/utils';
	import ArrowMarkerMapLibre from '$lib/ArrowMarkerMapLibre.svelte';

	let geojsonArray: any[] | null = null;
	let processedDataWithArrows: any[] | null = null;
	let boundariesCollection: any = null;

	// --- Constants ---
	const JOKOWI_COLOR = '#E11F26'; // Red
	const PRABOWO_COLOR = '#0099CC'; // Blue
	const NEUTRAL_COLOR = '#CCCCCC';

	// --- Utility Functions ---

	/** Determines the fill color based on the winner (using simple comparison) */
	// function getFillColor(jokowiPct: number, prabowoPct: number): string {
	// 	const diff = jokowiPct - prabowoPct;
	// 	if (diff > 0) return JOKOWI_COLOR;
	// 	if (diff < 0) return PRABOWO_COLOR;
	// 	return NEUTRAL_COLOR;
	// }

	// --- Map Setup ---
	let mapContainer: HTMLDivElement; // HTML element bound to the map
	let map: maplibregl.Map;

	// Initial map view for Indonesia
	const initialState = { lng: 118, lat: -2.5, zoom: 4 };

	const emptyStyle = {
		version: 8,
		sources: {},
		layers: [
			{
				id: 'background',
				type: 'background',
				paint: {
					'background-color': '#ffffff'
				}
			}
		]
	};

	// --- Data Loading and Setup ---
	onMount(async () => {
		// 1. Load GeoJSON features and combine using Turf
		geojsonArray = await loadFlatGeobuf('/kab_kota.fgb');
		// filter out features without data
		geojsonArray = geojsonArray.filter(
			(feature) => feature.properties?.comparison_kota_jokowi_percentage_change
		);

		// 2. Process data for centroids and arrows
		processedDataWithArrows = processArrowData(geojsonArray);
		const boundaryGeojson = await loadFlatGeobuf('/batas_provinsi.fgb');
		boundariesCollection = featureCollection(boundaryGeojson);

		// -- MapLibre Setup --
		map = new maplibregl.Map({
			container: mapContainer,
			// You can use any MapLibre-compatible style URL here (e.g., from MapTiler, OpenMapTiles, or your own)
			style: emptyStyle,
			center: [initialState.lng, initialState.lat],
			zoom: initialState.zoom
		});

		map.addControl(new maplibregl.NavigationControl(), 'top-right');

		map.on('load', () => {
			if (boundariesCollection) {
				map.addSource('provinces', {
					type: 'geojson',
					data: boundariesCollection
				});

				map.addLayer({
					id: 'province-borders',
					type: 'line',
					source: 'provinces',
					paint: {
						'line-color': '#888',
						'line-width': 1
					}
				});
			}
		});
	});

	onDestroy(() => {
		if (map) {
			map.remove();
		}
	});
</script>

<div class="page-container">
	<div class="map-chart-container">
		<h1>Pilpres 2014 vs 2019 - Change in Vote Percentage by Kabupaten/Kota</h1>
		<div bind:this={mapContainer} class="map">
			<p>Loading map...</p>
		</div>
		{#if map && processedDataWithArrows}
			{#each processedDataWithArrows as data, i (i)}
				{#if data.properties?.comparison_kota_jokowi_percentage_change}
					<ArrowMarkerMapLibre
						{map}
						lat={data.geometry.coordinates[1]}
						lon={data.geometry.coordinates[0]}
						angle={data.properties.angle}
						size={data.properties.size}
						change={data.properties.comparison_kota_jokowi_percentage_change}
						area={data.properties.KAB_KOTA}
					/>
				{/if}
			{/each}
		{/if}
	</div>
	<footer>
		<div>Source: <a href="https://github.com/kawalpemilu">Kawal Pemilu</a>*</div>
		<div class="disclaimer">
			*Disclaimer: The data taken from Kawal Pemilu is incomplete, thus the visualization may not
			reflect the complete and final result published by KPU.
		</div>
	</footer>
</div>

<style>
	h1 {
		text-align: center;
		font-weight: bold;
	}

	.map > p {
		text-align: center;
		width: 100%;
		height: 100%;
		line-height: 512px;
	}

	footer {
		display: flex;
		flex-direction: column;
		align-items: end;
		margin-top: 1rem;
		font-size: 0.75rem;
		width: 100%;
		color: #555;
	}

	.page-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}

	.map-chart-container {
		position: relative;
		width: 100%;
		height: 512px;
		display: flex;
		flex-direction: column;
	}

	.map {
		width: 100%;
		height: 100%;
	}

	.disclaimer {
		text-align: right;
		font-size: 0.625rem;
		margin-top: 1rem;
		max-width: 250px;
	}

	:global(.maplibregl-marker) {
		overflow: visible !important;
	}
</style>
