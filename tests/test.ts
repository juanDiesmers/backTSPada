import {TSPService} from '../src/services/tspService';
import { NetworkData, Point } from "../src/types";
// josm
// 🗺️ Red de prueba más compleja (10 nodos)
const network: NetworkData = {
    nodes: [
      { id: "A", lat: 0, lng: 0 },
      { id: "B", lat: 1, lng: 2 },
      { id: "C", lat: 2, lng: 3 },
      { id: "D", lat: 3, lng: 1 },
      { id: "E", lat: 4, lng: 0 },
      { id: "F", lat: 4, lng: 3 },
      { id: "G", lat: 3, lng: 4 },
      { id: "H", lat: 2, lng: 1 },
      { id: "I", lat: 1, lng: 4 },
      { id: "J", lat: 0, lng: 3 },
    ],
    edges: [
      { from: "A", to: "B", distance: 2.2 },
      { from: "B", to: "C", distance: 1.4 },
      { from: "C", to: "D", distance: 2.0 },
      { from: "D", to: "E", distance: 1.5 },
      { from: "E", to: "F", distance: 3.0 },
      { from: "F", to: "G", distance: 1.0 },
      { from: "G", to: "H", distance: 2.2 },
      { from: "H", to: "I", distance: 2.0 },
      { from: "I", to: "J", distance: 1.3 },
      { from: "J", to: "A", distance: 3.5 },
  
      // caminos extra para hacerlo interesante
      { from: "A", to: "H", distance: 2.8 },
      { from: "B", to: "G", distance: 3.6 },
      { from: "C", to: "I", distance: 2.9 },
      { from: "D", to: "J", distance: 4.0 },
      { from: "F", to: "B", distance: 2.1 },
      { from: "H", to: "D", distance: 1.2 },
      { from: "G", to: "A", distance: 5.0 }
    ]
  };
  
  // 📍 Puntos a visitar
  const points: Point[] = [
    { id: "A", lat: 0, lng: 0 },
    { id: "C", lat: 2, lng: 3 },
    { id: "E", lat: 4, lng: 0 },
    { id: "G", lat: 3, lng: 4 },
    { id: "I", lat: 1, lng: 4 },
    { id: "J", lat: 0, lng: 3 }
  ];
  
  // 🔍 Fuerza Bruta (lenta pero exacta)
  console.log("🔍 FUERZA BRUTA");
  try {
    const result = TSPService.bruteForce(network, points);
    console.log(result);
  } catch (e) {
    console.error("Error:", e);
  }
  
  // 🧭 Vecino más cercano
  console.log("\n🧭 VECINO MÁS CERCANO");
  try {
    const result = TSPService.nearestNeighbor(network, points);
    console.log(result);
  } catch (e) {
    console.error("Error:", e);
  }
  
  // 🧬 Algoritmo Genético
  console.log("\n🧬 ALGORITMO GENÉTICO");
  try {
    const result = TSPService.geneticAlgorithm(network, points);
    console.log(result);
  } catch (e) {
    console.error("Error:", e);
  }