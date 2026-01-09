<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import { buildPopupMessage } from '../utils/utils';

	let { lat, lon, angle, size, change, area, map } = $props();

	let marker: maplibregl.Marker;
	let svgContent = $derived(`
		<svg width="${size}px" height="${size}px" viewBox="0 0 100 100" style="
			transform: rotate(${angle}deg);
       ">	
			<path d="M 50 0 L 50 70 L 30 50 M 50 70 L 70 50" 
				  stroke="${change > 0 ? '#E53935' : '#1E3A8A'}" 
				  stroke-width="10" 
				  fill="none"
				  stroke-linecap="round"
		</svg>
	`);

	onMount(() => {
		const el = document.createElement('div');
		el.className = 'custom-maplibre-arrow';
		el.innerHTML = svgContent;

		marker = new maplibregl.Marker({
			element: el,
			anchor: 'center'
		})
			.setLngLat([lon, lat])
			.addTo(map);

		// Popups on hover
		const popup = new maplibregl.Popup({
			offset: 15,
			closeButton: false,
			closeOnClick: false
		}).setHTML(buildPopupMessage(area, change));

		el.addEventListener('mouseenter', () => {
			popup.setLngLat([lon, lat]).addTo(map);
		});

		el.addEventListener('mouseleave', () => {
			popup.remove();
		});
	});

	$effect(() => {
		if (marker && marker.getElement()) {
			marker.getElement().innerHTML = svgContent;
		}
	});

	// Clean up the marker when the component is destroyed
	onDestroy(() => {
		if (marker) {
			marker.remove();
		}
	});

	// IMPORTANT: MapLibre doesn't automatically react to prop changes on the marker element.
	// If your props (angle/size) change after mount, you'd need another reactive statement
	// or method to manually update the marker element's HTML/style.
	// For simplicity, this example assumes the props are static after the initial calculation.
</script>
