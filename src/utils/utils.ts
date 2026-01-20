import { deserialize } from 'flatgeobuf/lib/mjs/geojson.js';
import type { IGeoJsonFeature } from 'flatgeobuf';
import type LoadingBar from '$lib/components/LoadingBar.svelte';

function processArrowData(processedData: GeoJSON.Feature[]) {
	const MIN_SIZE = 6;
	const MAX_SIZE = 24;

	const maxAbsoluteChange = processedData.reduce((max, item) => {
		return Math.max(max, Math.abs(item.properties?.comparison_kota_jokowi_percentage_change));
	}, 0);

	return processedData.map((data) => {
		const change = data.properties?.comparison_kota_jokowi_percentage_change ?? 0;
		const absChange = Math.abs(change);

		// const clamped = Math.min(absChange, CLAMP_MAX);
		const t = Math.log1p(absChange) / Math.log1p(maxAbsoluteChange);

		const size = MIN_SIZE + t * (MAX_SIZE - MIN_SIZE);
		const angle = change > 0 ? 135 : change < 0 ? 225 : 0;

		return {
			...data,
			properties: {
				...data.properties,
				angle,
				size
			}
		};
	});
}

function buildPopupMessage(area: string, change: number) {
	const paslon = change > 0 ? 'Jokowi' : 'Prabowo';
	const popupMessage = `<strong>${area}</strong><br/>${paslon} Change: +${Math.abs(change).toFixed(2)}%`;
	return popupMessage;
}

async function loadFlatGeobuf(
	file = '/batas_provinsi.fgb',
	loadingBar: LoadingBar,
	totalLoadingValue: number = 100 // total progress value for loadFlatGeobuf process
) {
	const features: IGeoJsonFeature[] = [];

	const response = await fetch(file);
	if (!response.body) throw new Error('No response body');

	const contentLength = response.headers.get('Content-Length');
	if (!contentLength) {
		console.warn('No Content-Length header, progress unavailable');
	}

	const total = contentLength ? parseInt(contentLength, 10) : 0;
	let loadedBytes = 0;

	// Get current progress
	const progress = loadingBar.getProgress() ?? 0;

	// Wrap the stream to count bytes
	const reader = response.body.getReader();
	const stream = new ReadableStream<Uint8Array>({
		async pull(controller) {
			const { done, value } = await reader.read();
			if (done) {
				controller.close();
				return;
			}

			loadedBytes += value.length;
			if (total) {
				loadingBar.updateProgress(progress + (loadedBytes / total) * totalLoadingValue);
			}

			controller.enqueue(value);
		}
	});

	for await (const feature of deserialize(stream)) {
		features.push(feature);
	}

	loadingBar.updateProgress(progress + totalLoadingValue);
	return features;
}

export { processArrowData, buildPopupMessage, loadFlatGeobuf };
