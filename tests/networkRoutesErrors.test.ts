import request from 'supertest';

import app from '../src/app';

describe('network upload validation', () => {
  it('rejects missing file', async () => {
    const res = await request(app).post('/api/network/upload-osm');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/archivo .osm requerido/i);
  });

  it('rejects empty file', async () => {
    const res = await request(app)
      .post('/api/network/upload-osm')
      .attach('file', Buffer.from(''), 'empty.osm');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/vacion o malformado/i);
  });
});
