import { promises as fs } from 'fs';
import { resolve } from 'path';
import { Feature, FeatureCollection } from 'geojson';

export async function readNetworkGeoJSON(): Promise<FeatureCollection> {
    // Ajusatr la ruta a donde se guarde el GeoJson de la red
    const filePath = resolve(__dirname, '../data/network.geojson');
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as FeatureCollection;
}