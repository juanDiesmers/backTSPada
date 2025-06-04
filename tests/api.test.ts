import request from 'supertest';
import path from 'path';

import app from '../src/app';
import { setMesh } from '../src/services/meshService';
import { setPoints } from '../src/services/pointsService';

describe('API integration', () => {
  beforeEach(() => {
    // clear in-memory data
    setMesh([], []);
    setPoints([]);
  });

  it('responds to health check', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
  });

  it('uploads osm and points then runs nearest TSP', async () => {
    const osmPath = path.join(__dirname, 'fixtures', 'sample.osm');
    const tsvPath = path.join(__dirname, 'fixtures', 'sample.tsv');

    const osmRes = await request(app)
      .post('/api/network/upload-osm')
      .attach('file', osmPath);
    expect(osmRes.status).toBe(200);
    expect(osmRes.body.features.length).toBeGreaterThan(0);

    const ptsRes = await request(app)
      .post('/api/points/upload-points')
      .attach('file', tsvPath);
    expect(ptsRes.status).toBe(200);
    expect(ptsRes.body.points.length).toBe(2);

    const tspRes = await request(app).get('/api/network/tsp?type=nearest');
    expect(tspRes.status).toBe(200);
    expect(Array.isArray(tspRes.body.path)).toBe(true);
  });
});
