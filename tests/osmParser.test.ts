import fs from 'fs';
import path from 'path';
import { parseOSM } from '../src/utils/osmParser';

describe('parseOSM utility', () => {
  it('parses nodes and edges with distances', async () => {
    const filePath = path.join(__dirname, 'fixtures', 'sample.osm');
    const xml = fs.readFileSync(filePath, 'utf-8');
    const { nodes, edges } = await parseOSM(xml);
    expect(nodes).toHaveLength(4);
    expect(edges).toHaveLength(6);
    const e = edges.find(ed => ed.from === '1' && ed.to === '2');
    expect(e).toBeDefined();
    expect(e!.distance).toBeGreaterThan(111000);
    expect(e!.distance).toBeLessThan(112000);
  });
});
