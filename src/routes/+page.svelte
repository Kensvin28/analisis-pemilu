<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { featureCollection } from '@turf/helpers';
	import maplibregl from 'maplibre-gl';
	import { loadFlatGeobuf, processArrowData } from '../utils/utils';
	import ArrowMarkerMapLibre from '$lib/ArrowMarkerMapLibre.svelte';

	let geojsonArray: any[] | null = null;
	let processedDataWithArrows: any[] | null = $state(null);
	let boundariesCollection: any = null;

	let selectedYear: string = $state('2014');

	// --- Constants ---
	const JOKOWI_COLOR = '#E11F26'; // Red
	const PRABOWO_COLOR = '#0099CC'; // Blue
	const NEUTRAL_COLOR = '#CCCCCC';

	// --- Map Setup ---
	let mapContainer: HTMLDivElement; // HTML element bound to the map
	let map: maplibregl.Map;
	let mapLoaded: boolean = $state(false);

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

	function showPopup(popup: maplibregl.Popup, e: any) {
		map.getCanvas().style.cursor = 'pointer';

		if (!e.features?.length) return;

		const feature = e.features[0];
		const area = feature.properties?.KAB_KOTA;
		const jokowi_votes =
			feature.properties?.[`comparison_kota_Jokowi_${selectedYear}`] !== null
				? new Intl.NumberFormat('id-ID', { style: 'decimal', maximumFractionDigits: 0 }).format(
						feature.properties?.[`comparison_kota_Jokowi_${selectedYear}`]
					)
				: null;
		const prabowo_votes =
			feature.properties?.[`comparison_kota_Prabowo_${selectedYear}`] !== null
				? new Intl.NumberFormat('id-ID', { style: 'decimal', maximumFractionDigits: 0 }).format(
						feature.properties?.[`comparison_kota_Prabowo_${selectedYear}`]
					)
				: null;
		const jokowi_share =
			feature.properties?.[`comparison_kota_jokowi_share_${selectedYear}`] !== null
				? new Intl.NumberFormat('id-ID', { style: 'decimal', maximumFractionDigits: 2 }).format(
						feature.properties?.[`comparison_kota_jokowi_share_${selectedYear}`]
					)
				: null;
		const prabowo_share =
			feature.properties?.[`comparison_kota_prabowo_share_${selectedYear}`] !== null
				? new Intl.NumberFormat('id-ID', { style: 'decimal', maximumFractionDigits: 2 }).format(
						feature.properties?.[`comparison_kota_prabowo_share_${selectedYear}`]
					)
				: null;

		const firstMessage =
			selectedYear === '2014'
				? `Prabowo Votes: ${prabowo_votes} (${prabowo_share}%)`
				: `Jokowi Votes: ${jokowi_votes} (${jokowi_share}%)`;
		const secondMessage =
			selectedYear === '2014'
				? `Jokowi Votes: ${jokowi_votes} (${jokowi_share}%)`
				: `Prabowo Votes: ${prabowo_votes} (${prabowo_share}%)`;
		let message = `${firstMessage}<br/>
				${secondMessage}`;
		if (
			!!!feature.properties?.[`comparison_kota_Jokowi_${selectedYear}`] &&
			!!!feature.properties?.[`comparison_kota_Prabowo_${selectedYear}`]
		) {
			message = 'Data not available';
		}

		popup
			.setLngLat(e.lngLat)
			.setHTML(
				`
			<strong>${area}</strong><br/>
			${message}
			`
			)
			.addTo(map);
	}

	async function loadChloropleth() {
		// 1. Load GeoJSON features and combine using Turf
		geojsonArray = await loadFlatGeobuf('/kab_kota_borders_cleaned.fgb');
		// filter out features without data
		geojsonArray = geojsonArray.filter(
			(feature) => feature.properties?.comparison_kota_jokowi_percentage_change != null
		);
		boundariesCollection = {
			type: 'FeatureCollection',
			features: geojsonArray
		};

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
				map.addSource('kab_kota', {
					type: 'geojson',
					data: boundariesCollection
				});

				map.addLayer({
					id: 'kab-kota-borders',
					type: 'line',
					source: 'kab_kota',
					paint: {
						'line-color': '#888',
						'line-width': 1
					}
				});

				// set color based on winner
				map.addLayer({
					id: 'kab-kota-fill',
					type: 'fill',
					source: 'kab_kota',
					paint: {
						'fill-color': [
							'case',
							[
								'>',
								['get', 'comparison_kota_Jokowi_2014'],
								['get', 'comparison_kota_Prabowo_2014']
							],
							JOKOWI_COLOR,
							[
								'<',
								['get', 'comparison_kota_Jokowi_2014'],
								['get', 'comparison_kota_Prabowo_2014']
							],
							PRABOWO_COLOR,
							NEUTRAL_COLOR
						],
						'fill-opacity': 0.6
					}
				});

				//add popup on hover
				const popup = new maplibregl.Popup({
					offset: 15,
					closeButton: false,
					closeOnClick: false
				});

				map.on('click', 'kab-kota-fill', (e) => {
					showPopup(popup, e);
				});

				map.on('mouseenter', 'kab-kota-fill', (e) => {
					showPopup(popup, e);
				});

				map.on('mouseleave', 'kab-kota-fill', () => {
					map.getCanvas().style.cursor = '';
					popup.remove();
				});
			}
		});
	}

	function setYear(year: string) {
		map.setPaintProperty('kab-kota-fill', 'fill-color', [
			'case',
			['>', ['get', `comparison_kota_Jokowi_${year}`], ['get', `comparison_kota_Prabowo_${year}`]],
			JOKOWI_COLOR,
			['<', ['get', `comparison_kota_Jokowi_${year}`], ['get', `comparison_kota_Prabowo_${year}`]],
			PRABOWO_COLOR,
			NEUTRAL_COLOR
		]);
		selectedYear = year;
	}

	async function loadSwing() {
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
			mapLoaded = true;
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
	}

	const loadMap = async (selectedYear: string) => {
		mapLoaded = false;
		setYear(selectedYear);
		if (selectedYear === 'swing') {
			await loadSwing();
		} else {
			await loadChloropleth();
		}
	};

	onMount(async () => {
		if (selectedYear === 'swing') {
			await loadSwing();
		} else {
			await loadChloropleth();
		}
	});

	onDestroy(() => {
		if (map) {
			map.remove();
		}
	});
</script>

<div class="page-container">
	<h1>Pilpres 2014 vs 2019 - Change in Vote Percentage by Kabupaten/Kota</h1>
	<select bind:value={selectedYear} onchange={() => loadMap(selectedYear)}>
		<option value="swing">Swing</option>
		<option value="2014">2014</option>
		<option value="2019">2019</option>
	</select>
	<div bind:this={mapContainer} class="map">
		<p>Loading map...</p>
	</div>
	<div>{mapLoaded}</div>
	<div>{selectedYear}</div>
	<div>{!!processedDataWithArrows}</div>
	{#if mapLoaded && selectedYear === 'swing' && processedDataWithArrows}
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
