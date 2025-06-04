import fs from 'fs';
import path from 'path';
import { TSPService } from '../src/services/tspService';
import { NetworkData } from '../src/types';

describe('TSPService on larger mesh', () => {
  it('computes a route for the large fixture', () => {
    const networkPath = path.join(__dirname, 'fixtures', 'networkLarge.json');
    const pointsPath = path.join(__dirname, 'fixtures', 'pointsLarge.tsv');

    const network: NetworkData = JSON.parse(fs.readFileSync(networkPath, 'utf-8'));
    const tsv = fs.readFileSync(pointsPath, 'utf-8').trim();
    const pointIds = tsv.split(/\r?\n/).slice(1).map(l => l.split('\t')[0]);

    const result = TSPService.nearestNeighbor(network, pointIds);
    console.log('Large NN result:', result);

    expect(result.path.length).toBeGreaterThan(pointIds.length);
    expect(typeof result.distance).toBe('number');
  });
});