export type MapPoint = {
	lat: number
	lon: number
	label?: string
	tooltip?: string
	popup?: string
	color?: string
	radius?: number
}

export function isValidCoordinates(lat: number, lon: number): boolean {
	return (
		Number.isFinite(lat) &&
		Number.isFinite(lon) &&
		(lat !== 0 || lon !== 0) &&
		Math.abs(lat) <= 90 &&
		Math.abs(lon) <= 180
	)
}

/** Ссылка на точку / поиск в 2ГИС (открыть в новой вкладке). */
export function buildTwoGisMapPageUrl(options: {
	lat?: number
	lon?: number
	address: string
}): string {
	const { lat, lon, address } = options

	if (lat !== undefined && lon !== undefined && isValidCoordinates(lat, lon)) {
		return `https://2gis.ru/geo/${lon}%2C${lat}`
	}

	return `https://2gis.ru/search/${encodeURIComponent(address)}`
}

const TILE_KEY = 'c5e4d7ec-f9d0-470f-b7f0-278f622f20e2'

function buildLeafletMapHtml(options: {
	lat: number
	lon: number
	zoom: number
	centerMarker?: { color: string; popup?: string; tooltip?: string; radius?: number }
	points?: MapPoint[]
}): string {
	const { lat, lon, zoom, centerMarker, points = [] } = options
	const centerPopupJson = JSON.stringify(centerMarker?.popup?.trim() || '')
	const centerColor = centerMarker?.color ?? '#7c3aed'
	const centerRadius = centerMarker?.radius ?? 10
	const pointsJson = JSON.stringify(
		points.map(point => ({
			lat: point.lat,
			lon: point.lon,
			color: point.color ?? '#6b7280',
			radius: point.radius ?? 7,
			tooltip: point.tooltip?.trim() || point.label?.trim() || '',
			popup: point.popup?.trim() || point.label?.trim() || '',
		})),
	)

	return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
  <style>
    html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #e8eef3; }
    .leaflet-container { width: 100%; height: 100%; font: 12px/1.4 system-ui, sans-serif; }
    .leaflet-control-attribution { display: none !important; }
    .map-tooltip {
      font: 12px/1.3 system-ui, sans-serif;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
    .map-popup { font: 13px/1.4 system-ui, sans-serif; min-width: 140px; }
    .map-popup-type {
      font-weight: 700;
      font-size: 14px;
      color: #14201b;
      margin-bottom: 4px;
    }
    .map-popup-name { color: #495057; margin-bottom: 2px; }
    .map-popup-distance { color: #868e96; font-size: 12px; margin-bottom: 4px; }
    .map-popup-consequence { color: #c92a2a; font-size: 12px; margin-top: 4px; }
    #fallback {
      display: none; box-sizing: border-box; height: 100%; padding: 16px;
      font: 14px/1.4 system-ui, sans-serif; color: #6b7280;
      align-items: center; justify-content: center; text-align: center;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="fallback">Не удалось загрузить карту 2ГИС</div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
  <script>
    (function () {
      var lat = ${lat};
      var lon = ${lon};
      var zoom = ${zoom};
      var centerPopup = ${centerPopupJson};
      var centerTooltip = ${JSON.stringify(centerMarker?.tooltip?.trim() || centerMarker?.popup?.trim() || 'Объект недвижимости')};
      var centerColor = ${JSON.stringify(centerColor)};
      var centerRadius = ${centerRadius};
      var points = ${pointsJson};
      var mapEl = document.getElementById('map');
      var fallbackEl = document.getElementById('fallback');

      function showError() {
        if (mapEl) mapEl.style.display = 'none';
        if (fallbackEl) fallbackEl.style.display = 'flex';
      }

      function addCircleMarker(map, item) {
        var marker = L.circleMarker([item.lat, item.lon], {
          radius: item.radius,
          color: item.color,
          fillColor: item.color,
          fillOpacity: 0.9,
          weight: 1
        }).addTo(map);
        if (item.tooltip) {
          marker.bindTooltip(item.tooltip, {
            direction: 'top',
            offset: [0, -6],
            opacity: 0.95,
            className: 'map-tooltip'
          });
        }
        if (item.popup) {
          marker.bindPopup(item.popup, { maxWidth: 240 });
        }
      }

      try {
        if (!window.L) { showError(); return; }

        var map = L.map('map', { zoomControl: true, attributionControl: false }).setView([lat, lon], zoom);
        L.tileLayer(
          'https://tile{s}-sdk.maps.2gis.com/v2/tiles?x={x}&y={y}&z={z}&v=1&ts=online_sd&key=${TILE_KEY}',
          { subdomains: '0123', maxZoom: 18, attribution: '' }
        ).addTo(map);

        addCircleMarker(map, {
          lat: lat,
          lon: lon,
          color: centerColor,
          radius: centerRadius,
          tooltip: centerTooltip,
          popup: centerPopup
        });
        points.forEach(function (point) { addCircleMarker(map, point); });

        if (points.length > 0) {
          var bounds = L.latLngBounds([[lat, lon]]);
          points.forEach(function (point) { bounds.extend([point.lat, point.lon]); });
          map.fitBounds(bounds.pad(0.15));
        }

        setTimeout(function () { map.invalidateSize(); }, 50);
      } catch (e) {
        showError();
      }
    })();
  </script>
</body>
</html>`
}

/**
 * HTML-документ с картой 2ГИС (тайлы RasterJS) для iframe srcDoc.
 * У 2ГИС нет публичного map-widget URL как у Яндекса, поэтому карта собирается через Leaflet + тайлы 2ГИС.
 */
export function buildTwoGisMapSrcDoc(options: {
	lat: number
	lon: number
	address?: string
}): string | null {
	const { lat, lon, address } = options
	if (!isValidCoordinates(lat, lon)) return null

	const popupText = address?.trim() || `${lat}, ${lon}`

	return buildLeafletMapHtml({
		lat,
		lon,
		zoom: 16,
		centerMarker: { color: '#1c7ed6', popup: popupText, radius: 10 },
	})
}

export function buildTwoGisMapWithPointsSrcDoc(options: {
	lat: number
	lon: number
	address?: string
	goodPoints?: MapPoint[]
	badPoints?: MapPoint[]
}): string | null {
	const { lat, lon, address, goodPoints = [], badPoints = [] } = options
	if (!isValidCoordinates(lat, lon)) return null

	const centerPopup = address?.trim() || `${lat}, ${lon}`
	const points: MapPoint[] = [
		...goodPoints.map(point => ({
			...point,
			color: point.color ?? '#2f9e66',
			radius: point.radius ?? 5,
			popup: point.popup ?? `${point.label ?? ''}`.trim(),
		})),
		...badPoints.map(point => ({
			...point,
			color: point.color ?? '#e03131',
			radius: point.radius ?? 5,
			popup: point.popup ?? `${point.label ?? ''}`.trim(),
		})),
	]

	return buildLeafletMapHtml({
		lat,
		lon,
		zoom: 15,
		centerMarker: { color: '#1c7ed6', popup: centerPopup, tooltip: 'Объект недвижимости', radius: 10 },
		points,
	})
}

export function buildOsmMapEmbedUrl(options: {
	lat: number
	lon: number
	address?: string
}): string {
	const { lat, lon, address } = options

	if (!isValidCoordinates(lat, lon)) {
		const query = address?.trim() || `${lat}, ${lon}`
		return buildTwoGisMapPageUrl({ address: query })
	}

	const delta = 0.01
	const bbox = [lon - delta, lat - delta, lon + delta, lat + delta].join(',')
	return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`
}
