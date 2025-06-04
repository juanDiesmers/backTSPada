import request from 'supertest';
import path from 'path';

describe('file upload limit', () => {
  it('rejects files larger than the configured limit', async () => {
    jest.resetModules();
    process.env.UPLOAD_LIMIT_MB = '0.0001';
    const app = (await import('../src/app')).default;
    const osmPath = path.join(__dirname, 'fixtures', 'sample.osm');
    const res = await request(app)
      .post('/api/network/upload-osm')
      .attach('file', osmPath);
    expect(res.status).toBe(413);
  });
});
