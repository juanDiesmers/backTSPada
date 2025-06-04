import fs from 'fs';
import path from 'path';
import { TSPService } from '../src/services/tspService';
import { NetworkData } from '../src/types';

// Cargar malla y puntos desde fixtures
const networkPath = path.join(__dirname, 'fixtures', 'networkLarge.json');
const pointsPath = path.join(__dirname, 'fixtures', 'pointsLarge.tsv');

const network: NetworkData = JSON.parse(fs.readFileSync(networkPath, 'utf-8'));
const tsv = fs.readFileSync(pointsPath, 'utf-8').trim();
const pointIds = tsv.split(/\r?\n/).slice(1).map(l => l.split('\t')[0]);

console.log(`Malla cargada: ${network.nodes.length} nodos, ${network.edges.length} aristas`);
console.log(`Puntos a visitar: ${pointIds.join(', ')}`);

// 🔍 Fuerza Bruta
console.log('\n🔍 FUERZA BRUTA');
try {
  const result = TSPService.bruteForce(network, pointIds);
  console.log(JSON.stringify(result, null, 2));
} catch (e) {
  console.error('Error:', e);
}

// 🧭 Vecino más cercano
console.log('\n🧭 VECINO MÁS CERCANO');
try {
  const result = TSPService.nearestNeighbor(network, pointIds);
  console.log(JSON.stringify(result, null, 2));
} catch (e) {
  console.error('Error:', e);
}

// 🧬 Algoritmo Genético
console.log('\n🧬 ALGORITMO GENÉTICO');
try {
  const result = TSPService.geneticAlgorithm(network, pointIds);
  console.log(JSON.stringify(result, null, 2));
} catch (e) {
  console.error('Error:', e);
}
