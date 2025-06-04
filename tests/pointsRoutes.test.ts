import request from 'supertest';
import path from 'path';

import app from '../src/app';
import { setMesh } from '../src/services/meshService';
import { setPoints } from '../src/services/pointsService';

describe('points routes', () => {
  beforeEach(() => {
    setMesh([], []);
    setPoints([]);
  });

  it('fails to upload points when no mesh is loaded', async () => {
    const tsvPath = path.join(__dirname, 'fixtures', 'sample.tsv');
    const res = await request(app)
      .post('/api/points/upload-points')
      .attach('file', tsvPath);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/No hay malla cargada/i);
  });
});
