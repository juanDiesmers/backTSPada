// src/services/networkService.ts
import { FeatureCollection, Feature, Point, LineString } from 'geojson';
import nearestPointOnLine from '@turf/nearest-point-on-line';
import { readNetworkGeoJSON } from './networkIO';

export interface RawPoint {
  id: string;
  lat: number;
  lon: number;
}

export interface SnappedPoint {
  id: string;
  lat: number;
  lon: number;
  snapped: [number, number];
  dist: number;
}

export async function snapPointsToNetwork(
  points: RawPoint[]
): Promise<SnappedPoint[]> {
  // 1. Cargamos la red en GeoJSON
  const network: FeatureCollection = await readNetworkGeoJSON();

  // 2. Filtramos sólo las LineString (aristas)
  const lines = network.features.filter(
    (f): f is Feature<LineString> => f.geometry.type === 'LineString'
  );

  // 3. Para cada punto, buscamos el punto más cercano en todas las líneas
  const result: SnappedPoint[] = points.map((pt) => {
    const p: Feature<Point> = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [pt.lon, pt.lat] },
      properties: {}
    };

    let best: { snapped: [number, number]; dist: number } | null = null;

    for (const line of lines) {
      const snappedFeat = nearestPointOnLine(line, p);
      const dist = snappedFeat.properties?.dist ?? Infinity;
      const coord = snappedFeat.geometry.coordinates as [number, number];

      if (!best || dist < best.dist) {
        best = { snapped: coord, dist };
      }
    }

    return {
      id: pt.id,
      lat: pt.lat,
      lon: pt.lon,
      snapped: best!.snapped,
      dist: best!.dist
    };
  });

  return result;
}
