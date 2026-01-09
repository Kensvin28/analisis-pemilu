import type { SubdistrictVoteData } from '../types/votes.type';
import { deserialize } from 'flatgeobuf/lib/mjs/geojson.js';
import type { IGeoJsonFeature } from 'flatgeobuf';

// Function to calculate the centroid of each area
function getAreaCentroids(geojson: GeoJSON.Feature[], data: SubdistrictVoteData[]) {
	console.log('Calculating centroids for area...', geojson);
	return data
		.map((dataRow: SubdistrictVoteData) => {
			const areaName = dataRow['Nama Kelurahan_2014'];

			// Find the corresponding feature in the GeoJSON
			const feature = geojson.find((f) => f?.properties?.NAME === areaName.toUpperCase());
			if (feature && feature.geometry.type === 'Point') {
				return {
					...dataRow,
					lat: feature.geometry.coordinates[1],
					lon: feature.geometry.coordinates[0]
				};
			}
			return null;
		})
		.filter(Boolean);
}

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

async function loadFlatGeobuf(file = '/batas_provinsi.fgb') {
	let features: IGeoJsonFeature[] = [];

	try {
		const response = await fetch(file);
		const loadedFeatures = [];

		for await (const feature of deserialize(response?.body as ReadableStream<Uint8Array>)) {
			loadedFeatures.push(feature);
		}

		features = loadedFeatures;
		return features;
	} catch (error) {
		console.error('Error loading FlatGeobuf:', error);
		alert('Error loading FlatGeobuf file: ' + (error as Error).message);
		return features;
	}
}

export { getAreaCentroids, processArrowData, buildPopupMessage, loadFlatGeobuf };
