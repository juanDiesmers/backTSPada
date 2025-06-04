import fs from 'fs';
import path from 'path';
import { UploadedFile } from 'express-fileupload';
import { processNetworkFile } from '../src/controllers/networkController';

describe('processNetworkFile', () => {
  it('parses a JSON network with edges', () => {
    const filePath = path.join(__dirname, 'fixtures', 'sampleNetwork.json');
    const content = fs.readFileSync(filePath);
    const file = {
      mimetype: 'application/json',
      data: content
    } as UploadedFile;

    const network = processNetworkFile(file);

    expect(network.nodes).toHaveLength(2);
    expect(network.edges).toHaveLength(1);
    expect(network.edges[0]).toEqual({ from: '1', to: '2', distance: 5 });
  });
});
