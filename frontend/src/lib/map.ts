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
	const popupJson = JSON.stringify(popupText)
	// Demo-ключ из официального loader Maps API 2.0 (сервис tiles-raster-api активен)
	const tileKey = 'c5e4d7ec-f9d0-470f-b7f0-278f622f20e2'

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
      var popupText = ${popupJson};
      var mapEl = document.getElementById('map');
      var fallbackEl = document.getElementById('fallback');

      function showError() {
        if (mapEl) mapEl.style.display = 'none';
        if (fallbackEl) fallbackEl.style.display = 'flex';
      }

      try {
        if (!window.L) { showError(); return; }

        var map = L.map('map', { zoomControl: true }).setView([lat, lon], 16);
        L.tileLayer(
          'https://tile{s}-sdk.maps.2gis.com/v2/tiles?x={x}&y={y}&z={z}&v=1&ts=online_sd&key=${tileKey}',
          {
            subdomains: '0123',
            maxZoom: 18,
            attribution: '&copy; <a href="https://2gis.ru" target="_blank" rel="noopener">2GIS</a>'
          }
        ).addTo(map);

        var marker = L.marker([lat, lon]).addTo(map);
        if (popupText) marker.bindPopup(popupText);

        setTimeout(function () { map.invalidateSize(); }, 50);
      } catch (e) {
        showError();
      }
    })();
  </script>
</body>
</html>`
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
